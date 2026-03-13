# Plan: Complete Developer Documentation Set

## Goal
Create a full onboarding-oriented documentation suite in `docs/` that covers high-level architecture and every source-level symbol (functions, constants, types, component interfaces, composables, computed values, watchers, and state handlers). The docs must support both:
- Beginner Primer: concept-first onboarding for new developers.
- Practical Deep Dive: complete reference-level documentation.

## Commit Convention
Use atomic documentation commits with this format:
- `docs(scope): imperative summary`

## Phases

### Phase 1: Documentation Framework and Navigation
1. Add docs landing page and navigation index with two tracks: Beginner Primer and Practical Deep Dive.
2. Add documentation standards page with a fixed symbol template:
   - Purpose
   - Signature/Shape
   - Inputs
   - Outputs
   - Side Effects
   - Invariants
   - Called By
   - Depends On
   - Examples
3. Commit:
   - `docs(docs): add documentation hub and standards`

### Phase 2: Architecture and Runtime Model
1. Add architecture overview with Mermaid diagrams:
   - Component tree
   - Parser -> engine -> snapshots -> UI flow
   - Tick lifecycle
   - Play/pause/step/reset/apply transitions
2. Add onboarding walkthrough in two sections:
   - Beginner Primer
   - Practical Deep Dive
3. Document newcomer pitfalls:
   - Cycle 0 semantics
   - R0 write suppression
   - Single load-use bubble behavior
   - MEM->EX-only forwarding path
   - Completion semantics (`isMachineComplete`)
4. Commit:
   - `docs(architecture): add onboarding architecture and runtime flow diagrams`

### Phase 3: Simulator API Reference
1. Document `src/simulator/types.ts` completely (all exported constants/types/interfaces).
2. Document `src/simulator/config.ts` and `src/simulator/initialState.ts` (all functions/constants and initialization semantics).
3. Document `src/simulator/parser.ts` (public API + internal helpers/constants, grammar, regex constraints, error modes).
4. Document `src/simulator/engine.ts` (public APIs + all internal helpers and per-stage algorithm semantics).
5. Add simulator behavior appendix (hazards, forwarding, writeback/memory semantics, deterministic tick order).
6. Commits:
   - `docs(simulator-types): document simulator types and constants`
   - `docs(simulator-init): document configuration and initial state builders`
   - `docs(parser): document parser grammar and helpers`
   - `docs(engine): document execution engine and completion semantics`

### Phase 4: UI and Component Reference
1. Document `src/ui/state.ts` (state fields, timing behavior, lifecycle).
2. Document `src/ui/useGlossary.ts` and `src/ui/glossary.ts` (composable contract and glossary schema).
3. Document `src/App.vue` (computed values, watchers, handlers, rendering responsibilities).
4. Document all components:
   - `GlossaryTooltip.vue`
   - `GlossaryPanel.vue`
   - `InstructionText.vue`
   - `EventLogEntry.vue`
   - `HelloWorld.vue` status note
5. Add user interaction flow docs (controls, scrubber, parser errors, event log behavior).
6. Commits:
   - `docs(ui-state): document UI state manager and glossary composable/data`
   - `docs(app): document root orchestration and computed visualization layers`
   - `docs(components): document all Vue components and interaction flow`

### Phase 5: Contributor and Verification Docs
1. Add testing/validation workflows for `npm run build`, `npm run test`, `npm run test:watch`.
2. Add extension guide for:
   - New opcodes
   - Hazard rules
   - UI controls
   - Glossary terms
   - Tests
3. Add source-to-doc traceability matrix proving full symbol coverage.
4. Commit:
   - `docs(contributing): add verification workflow and extension guide`

### Phase 6: Quality Pass and Coverage Audit
1. Verify every symbol in `src/` is documented.
2. Verify all Mermaid diagrams render.
3. Verify links and anchors from docs landing page.
4. Commit:
   - `docs(polish): cross-link docs and finalize symbol coverage audit`

## Verification Gates
1. Run `npm run build` before every commit.
2. Run `npm run test` after major documentation milestones.
3. Keep each commit atomic and scoped.
4. Confirm no code behavior changes are introduced while documenting.

## Deliverables (Planned)
- `docs/README.md`
- `docs/standards/symbol-template.md`
- `docs/architecture/overview.md`
- `docs/architecture/runtime-flow.md`
- `docs/simulator/types.md`
- `docs/simulator/config-and-init.md`
- `docs/simulator/parser.md`
- `docs/simulator/engine.md`
- `docs/ui/state.md`
- `docs/ui/glossary.md`
- `docs/ui/app-root.md`
- `docs/components/components-reference.md`
- `docs/contributing/testing-and-validation.md`
- `docs/contributing/extending-the-simulator.md`
- `docs/reference/symbol-coverage-matrix.md`
