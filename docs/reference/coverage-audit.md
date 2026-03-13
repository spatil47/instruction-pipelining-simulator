# Coverage Audit Checklist

## Audit Goal
Confirm documentation coverage for all source-level symbols in `src/` and verify onboarding usability for a new developer.

## Symbol Coverage Checklist
- [x] `src/simulator/types.ts` fully documented
- [x] `src/simulator/config.ts` fully documented
- [x] `src/simulator/initialState.ts` fully documented
- [x] `src/simulator/parser.ts` fully documented (including internal helpers/constants)
- [x] `src/simulator/engine.ts` fully documented (including internal helpers)
- [x] `src/ui/state.ts` fully documented
- [x] `src/ui/useGlossary.ts` fully documented
- [x] `src/ui/glossary.ts` documented (schema + dataset constant)
- [x] `src/App.vue` documented (computed/watch/handlers)
- [x] `src/components/GlossaryTooltip.vue` documented
- [x] `src/components/GlossaryPanel.vue` documented
- [x] `src/components/InstructionText.vue` documented
- [x] `src/components/EventLogEntry.vue` documented
- [x] `src/components/HelloWorld.vue` documented (status + symbol note)
- [x] `src/main.ts` documented
- [x] `src/style.css` referenced in app-root styling/responsiveness notes
- [x] `src/vite-env.d.ts` classified as type shim with no runtime symbols

## Onboarding Coverage Checklist
- [x] Architecture overview with mental model
- [x] Runtime flow and lifecycle diagrams
- [x] Beginner Primer sections
- [x] Practical Deep Dive sections
- [x] Common pitfalls captured (cycle 0, R0, load-use, forwarding scope, completion semantics)

## Documentation UX Checklist
- [x] Docs hub exists (`docs/README.md`)
- [x] Navigation links connect all major docs pages
- [x] Mermaid diagrams included for architecture/runtime/flow
- [x] Contributor workflow and extension guide included
- [x] Source-to-doc traceability matrix included

## Maintenance Rule
Whenever symbols are added, removed, or renamed in `src/`, update:
1. Relevant module documentation page
2. `docs/reference/symbol-coverage-matrix.md`
3. This audit checklist if coverage boundaries change
