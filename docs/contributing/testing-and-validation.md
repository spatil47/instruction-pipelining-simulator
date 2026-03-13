# Testing and Validation Workflow

## Purpose
Provide a repeatable quality gate for contributors making simulator, UI, or documentation changes.

## Core Commands
- `npm run dev`: run local development server.
- `npm run build`: type-check and production build.
- `npm run test`: run unit tests.
- `npm run test:watch`: iterative TDD loop.

## Recommended Pre-Commit Checklist
1. Run `npm run build`.
2. Run `npm run test` for simulator/UI behavior confidence.
3. Verify docs links and Mermaid blocks for documentation changes.
4. Ensure commit is atomic and message follows `type(scope): imperative summary`.

## When to Run Which Command
- Docs-only changes:
  - Minimum: `npm run build`
  - Recommended: quick `npm run test` at phase boundaries
- Parser/engine changes:
  - Required: `npm run build` + `npm run test`
- UI behavior changes:
  - Required: `npm run build`
  - Recommended: `npm run test` and manual `npm run dev` verification

## Manual QA Scenarios
1. Program parse error visibility in editor.
2. Play/pause/step/reset controls behavior.
3. Completion auto-stop behavior.
4. Timeline scrubbing and LIVE reset.
5. Forwarding and hazard overlays visible for demo program.
6. Mobile layout behavior at 900px/768px/600px breakpoints.

## Docs QA Scenarios
1. Every source symbol has at least one documentation entry.
2. Mermaid diagrams render in Markdown preview.
3. Navigation from `docs/README.md` reaches all referenced pages.
4. Coverage matrix is updated when symbols change.

## Export Comment Guardrail
1. If you add, remove, or change an exported symbol in `src/`, update that symbol's TSDoc in the same commit.
2. Treat in-code TSDoc as API source of truth; module docs should summarize and link back to source.
3. Re-run the checklist in `docs/reference/tsdoc-export-checklist.md` before merging API-affecting changes.

## Troubleshooting
- Build fails after docs edits:
  - inspect for accidental code-file edits or malformed fenced blocks copied into code files.
- Test failures after simulator changes:
  - inspect `src/simulator/simulator.test.ts` groups by parser/stage/execution/hazard/forwarding.
- UI runtime oddities:
  - check `src/ui/state.ts` interval lifecycle and `src/App.vue` watcher/recomputed logic.
