# Documentation Hub

This documentation is organized for two audiences:
- Beginner Primer: concept-first onboarding for new contributors.
- Practical Deep Dive: file-by-file reference for every symbol in the codebase.

## Start Here
1. Beginner Primer
2. Practical Deep Dive
3. Contributing and Verification

## Beginner Primer
- Architecture overview: `docs/architecture/overview.md`
- Runtime flow walkthrough: `docs/architecture/runtime-flow.md`
- Common pitfalls and mental models are embedded in both pages.

## Practical Deep Dive
- Simulator
  - `docs/simulator/types.md`
  - `docs/simulator/config-and-init.md`
  - `docs/simulator/parser.md`
  - `docs/simulator/engine.md`
- UI and App Orchestration
  - `docs/ui/state.md`
  - `docs/ui/glossary.md`
  - `docs/ui/app-root.md`
- Components
  - `docs/components/components-reference.md`

## Contributing and Verification
- Testing and validation workflow: `docs/contributing/testing-and-validation.md`
- Extending the simulator safely: `docs/contributing/extending-the-simulator.md`
- Source-to-doc coverage matrix: `docs/reference/symbol-coverage-matrix.md`

## Coverage Policy
The docs are intentionally exhaustive. Every function, constant, type/interface, composable, computed value, watch handler, and event handler in `src/` must be represented by at least one documentation entry.

## Quick Workflow
1. Read the Beginner Primer pages.
2. Trace behavior through the module docs for the area you are changing.
3. Use the extension guide before introducing new opcode/hazard/UI behavior.
4. Update the symbol coverage matrix whenever symbols are added/removed/renamed.
