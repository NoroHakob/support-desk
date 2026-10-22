# My changes to Jan's plan (highest priority)

This project is Norayr's build-along of Jan Marshal's MarshalDesk. Jan's documents (`AGENTS.md`, `CONTEXT.md`, `docs/PRD.md`, `docs/TECH-STACK.md`, `docs/DESIGN.md`, `docs/PROMPTS.md`) are followed as written, **except where this file says otherwise. Where this file conflicts with any of them, this file wins.**

## 1. Who you work with

- The product is called SupportDesk. Wherever the docs say MarshalDesk in user-facing text (UI copy, titles, emails, widget), use SupportDesk.
- Wherever the docs say "Jan" (asking questions, reporting decisions, "Working with Jan"), read "Norayr". Same preferences: a recommended option first, one topic at a time.
- Norayr is learning. After each task, give a short plain-English summary of what was built and why.

## 2. Environment

- Windows, PowerShell, VS Code. The project lives under OneDrive.
- Use PowerShell syntax. Don't use bash-only syntax (`export`, `rm -rf`, `&&` chains, `$VAR` for env vars). Run commands one by one or separate them with `;`.
- If a command fails with `EPERM`, `EBUSY` or a locked file, say that OneDrive sync may be locking it.
- Node 24.7, pnpm 10.27.

## 3. AI: Gemini directly, not the Neon AI Gateway

The Neon AI Gateway needs a paid plan, so it is **not used**. This replaces the provider parts of TECH-STACK section 8, the "Neon AI Gateway" and "Embeddings" rows in PRD section 8, and the Neon AI Gateway bullet in `AGENTS.md`.

- Provider: `@ai-sdk/google` with Vercel AI SDK 7. Don't install `@neon/ai-sdk-provider`. `@ai-sdk/openai` isn't needed.
- API key: `GOOGLE_GENERATIVE_AI_API_KEY`, server-only (`apps/web` and `apps/functions`). Never `NEXT_PUBLIC_`.
- Models, kept in `packages/shared/src/agent.ts`:

  | Use                                      | Model                                                      |
  | ---------------------------------------- | ---------------------------------------------------------- |
  | Classifier (`Output.object`)             | `gemini-3.8-flash`                                         |
  | Off-topic refusals and small talk        | `gemini-3.8-flash`                                         |
  | Answers (streamed, `cannot_answer` tool) | `gemini-3.8-flash`                                         |
  | Suggested questions                      | `gemini-3.8-flash`                                         |
  | Embeddings (chunks and queries)          | `gemini-embedding-2`, `outputDimensionality: 1024`, cosine |

- No Google Search grounding.
- Reasoning effort: replace `providerOptions.openai.reasoningEffort` with the Google provider's thinking setting: the lowest level for the classifier, short replies and answers, a moderate level for suggested questions. Check the Google provider page on ai-sdk.dev for the exact option names; don't guess.
- Embeddings: keep `vector(1024)`. Drop the Qwen query instruction prefix. If the Google provider supports retrieval task types (query vs document), use them; otherwise embed both the same way. Check whether returned vectors are unit length; if not, normalize them before saving and before searching.
- Jan's note "No Gemini" in TECH-STACK section 8 is about the Neon provider only and does not apply here.
- The retrieval thresholds (0.5 / 0.4) were tuned for Qwen3. Keep them as starting values; they'll be retuned with the PRD section 9 checklist.

## 4. Free-tier quota

- `gemini-3.8-flash` on the free tier allows about **20 requests per day**, reset at midnight Pacific time. Embeddings have their own, larger quota.
- Never call Gemini in loops, scripts, or your own verification steps without asking. Don't test the agent yourself by sending messages; tell me which PRD section 9 checklist items to run, and I'll run them.
- If Gemini returns a quota or rate-limit error (429) during an agent turn, don't crash and don't retry in a loop: hand off exactly like `cannot_answer` (reason `low_confidence`) and log the error.
- Suggested-question regeneration costs one request per knowledge base change. Don't trigger it more often than the PRD requires.
- This is not a product rate limit. Rate limits and usage quotas stay a non-goal.

## 5. Database and migrations

- Neon Free plan, Frankfurt region (`aws-eu-central-1`).
- Migrations use Prisma as in TECH-STACK, on the Neon `development` branch first.
- One new migration per change. **Never edit or delete an existing migration file.**
- After creating a migration, tell me its name and the exact command to apply it. Never apply anything to `production` unless I ask.

## 6. Git and deployment

- Commit straight to `main`. No branches, no pull requests, no CodeRabbit.
- Commit only when I ask (usually at the end of a task), with a clear message. Never push or deploy unless I ask.
- Hosting as in TECH-STACK: Vercel (`apps/web`), Cloudflare (`apps/realtime`), Neon (database, auth, functions, storage).

## 7. Secrets

- Never put secrets in `NEXT_PUBLIC_` variables.
- Never read, print, or ask me to share the contents of `.env`, `.env.local` or `.dev.vars`. Keep `*.example` files up to date with empty values.
- `.env*` and `.dev.vars` stay git-ignored.

## 8. Observability

- LangSmith is not used for now. Agent turns are logged in `agent_turns`, as Jan planned. Don't add LangSmith unless I ask.
