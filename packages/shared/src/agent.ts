// Models and settings for every Gemini call (docs/MY-CHANGES.md section 3).

export const AGENT_MODELS = {
  classifier: "gemini-3.8-flash",
  reply: "gemini-3.8-flash",
  answer: "gemini-3.8-flash",
  suggestedQuestions: "gemini-3.8-flash",
  embedding: "gemini-embedding-2",
} as const;

export const THINKING_LEVELS = {
  classifier: "minimal",
  reply: "minimal",
  answer: "minimal",
  suggestedQuestions: "medium",
} as const;

export const EMBEDDING_DIMENSIONS = 1024;

// gemini-embedding-2 has no task types; Google recommends these prefixes for
// retrieval instead (ai.google.dev/gemini-api/docs/embeddings).
export function embeddingDocumentText(title: string, text: string) {
  return `title: ${title || "none"} | text: ${text}`;
}

export function embeddingQueryText(query: string) {
  return `task: search result | query: ${query}`;
}

/** Scales a vector to unit length, so cosine similarity is a dot product. */
export function normalizeVector(vector: readonly number[]): number[] {
  const length = Math.hypot(...vector);
  return length === 0 ? [...vector] : vector.map((value) => value / length);
}
