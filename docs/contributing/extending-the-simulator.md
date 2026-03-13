# Extending the Simulator Safely

## Beginner Primer
Most feature work falls into one of five categories:
1. Add opcode behavior.
2. Add hazard or forwarding behavior.
3. Add UI control/visualization.
4. Add glossary knowledge.
5. Add tests.

Use this guide to keep behavior and documentation synchronized.

## 1) Adding a New Opcode
1. Update opcode union in `src/simulator/types.ts`.
2. Update parser:
   - include opcode in `OPCODE_SET`
   - route parse logic in `parseProgram`
   - add helper parser if needed
3. Update engine execution in `executeInstruction`.
4. Update tests in `src/simulator/simulator.test.ts`.
5. Update glossary term in `src/ui/glossary.ts`.
6. Update docs pages:
   - `docs/simulator/types.md`
   - `docs/simulator/parser.md`
   - `docs/simulator/engine.md`
   - `docs/ui/glossary.md`
   - `docs/reference/symbol-coverage-matrix.md`

## 2) Adding Hazard/Forwarding Rules
1. Extend event/model types in `src/simulator/types.ts` if needed.
2. Update hazard/forwarding logic in `tickMachine`.
3. Ensure event logging and overlays still map correctly.
4. Add tests under hazard/forwarding suites.
5. Update architecture/runtime docs and engine docs.

## 3) Adding a UI Control
1. Add UI state field and action in `src/ui/state.ts` if persistent behavior is needed.
2. Add handler/computed wiring in `src/App.vue`.
3. Add panel/tooltips/component updates where necessary.
4. Validate mobile layout and keyboard accessibility.
5. Update docs pages for changed symbols.

## 4) Adding Glossary Content
1. Add entry to `src/ui/glossary.ts` with `term`, `category`, `preview`, and `definition`.
2. Add optional syntax/example/diagram/related terms.
3. Verify tooltip and panel rendering behavior.
4. Update glossary docs and coverage matrix.

## 5) Adding Tests
1. Prefer colocated tests in `src/**/*.test.ts`.
2. Group with existing describe sections by behavior area.
3. Keep deterministic and side-effect-contained test cases.
4. Ensure both happy-path and edge-case assertions.

## Change Safety Rules
1. Keep parser, engine, and type updates in sync.
2. Never introduce behavior without matching tests.
3. Keep docs changes in the same feature branch and update coverage matrix.
4. Use atomic commits for each logical unit.
