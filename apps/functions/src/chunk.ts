// A small splitter (TECH-STACK section 9): by headings, then paragraphs, then
// sentences. Sizes are in estimated tokens (characters ÷ 3.5).

const CHARS_PER_TOKEN = 3.5;
const CHUNK_CHARS = Math.round(800 * CHARS_PER_TOKEN);
const OVERLAP_CHARS = Math.round(100 * CHARS_PER_TOKEN);
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;

type Section = { path: string[]; body: string };

function sections(text: string): Section[] {
  const result: Section[] = [];
  const stack: { level: number; title: string }[] = [];
  let lines: string[] = [];
  let inFence = false;

  const flush = () => {
    const body = lines.join("\n").trim();
    if (body) {
      result.push({ path: stack.map((item) => item.title), body });
    }
    lines = [];
  };

  for (const line of text.split("\n")) {
    if (FENCE_PATTERN.test(line)) {
      inFence = !inFence;
    }
    const heading = inFence ? null : HEADING_PATTERN.exec(line);
    if (heading?.[1] && heading[2]) {
      flush();
      const level = heading[1].length;
      while ((stack.at(-1)?.level ?? 0) >= level) {
        stack.pop();
      }
      stack.push({ level, title: heading[2] });
    } else {
      lines.push(line);
    }
  }
  flush();
  return result;
}

// Joins parts with spaces into strings no longer than `max`.
function pack(parts: string[], max: number): string[] {
  const result: string[] = [];
  let current = "";
  for (const part of parts) {
    if (part.length > max) {
      if (current) result.push(current);
      current = "";
      for (let start = 0; start < part.length; start += max) {
        result.push(part.slice(start, start + max));
      }
    } else if (!current || current.length + 1 + part.length <= max) {
      current = current ? `${current} ${part}` : part;
    } else {
      result.push(current);
      current = part;
    }
  }
  if (current) result.push(current);
  return result;
}

// Breaks text into pieces no longer than `max`: whole paragraphs where they
// fit, otherwise runs of sentences, otherwise runs of words.
function pieces(text: string, max: number): string[] {
  if (text.length <= max) {
    return [text];
  }
  const paragraphs = text.split(/\n\s*\n/).filter((part) => part.trim());
  if (paragraphs.length > 1) {
    return paragraphs.flatMap((paragraph) => pieces(paragraph.trim(), max));
  }
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return pack(
    sentences.length > 1 ? sentences : text.split(/\s+/).filter(Boolean),
    max,
  );
}

// The end of the previous chunk, starting at a word boundary.
function overlap(text: string) {
  if (text.length <= OVERLAP_CHARS) {
    return text;
  }
  const tail = text.slice(-OVERLAP_CHARS);
  const space = tail.indexOf(" ");
  return space === -1 ? tail : tail.slice(space + 1);
}

/** Splits a document into chunks that each start with their heading path. */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  for (const section of sections(text.replace(/\r\n?/g, "\n"))) {
    const prefix =
      section.path.length > 0 ? `${section.path.join(" > ")}\n\n` : "";
    const budget = CHUNK_CHARS - prefix.length - OVERLAP_CHARS;
    let current = "";
    let previous = "";
    for (const piece of pieces(section.body, budget)) {
      const joined = current ? `${current}\n\n${piece}` : piece;
      if (joined.length <= budget || !current) {
        current = joined;
        continue;
      }
      chunks.push(prefix + (previous ? `${overlap(previous)} ` : "") + current);
      previous = current;
      current = piece;
    }
    if (current) {
      chunks.push(prefix + (previous ? `${overlap(previous)} ` : "") + current);
    }
  }
  return chunks;
}
