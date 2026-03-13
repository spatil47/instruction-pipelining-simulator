# Documentation Hub

This documentation is organized for two audiences:
- Beginner Primer: concept-first onboarding for new contributors.
- Practical Deep Dive: file-by-file reference for every symbol in the codebase.

## Start Here
1. Beginner Primer
  - [Architecture overview](architecture/overview.md)
  - [Runtime flow walkthrough](architecture/runtime-flow.md)
2. Practical Deep Dive
  - [Simulator types](simulator/types.md)
  - [Simulator config and init](simulator/config-and-init.md)
  - [Parser reference](simulator/parser.md)
  - [Engine reference](simulator/engine.md)
  - [UI state manager](ui/state.md)
  - [UI glossary and composable](ui/glossary.md)
  - [App root orchestration](ui/app-root.md)
  - [Component reference](components/components-reference.md)
3. Contributing and Verification
  - [Testing and validation workflow](contributing/testing-and-validation.md)
  - [Extending the simulator](contributing/extending-the-simulator.md)
  - [Symbol coverage matrix](reference/symbol-coverage-matrix.md)
  - [Coverage audit checklist](reference/coverage-audit.md)

## Beginner Primer
- Architecture overview: [docs/architecture/overview.md](architecture/overview.md)
- Runtime flow walkthrough: [docs/architecture/runtime-flow.md](architecture/runtime-flow.md)
- Common pitfalls and mental models are embedded in both pages.

## Practical Deep Dive
- Simulator
  - [docs/simulator/types.md](simulator/types.md)
  - [docs/simulator/config-and-init.md](simulator/config-and-init.md)
  - [docs/simulator/parser.md](simulator/parser.md)
  - [docs/simulator/engine.md](simulator/engine.md)
- UI and App Orchestration
  - [docs/ui/state.md](ui/state.md)
  - [docs/ui/glossary.md](ui/glossary.md)
  - [docs/ui/app-root.md](ui/app-root.md)
- Components
  - [docs/components/components-reference.md](components/components-reference.md)

## Contributing and Verification
- Testing and validation workflow: [docs/contributing/testing-and-validation.md](contributing/testing-and-validation.md)
- Extending the simulator safely: [docs/contributing/extending-the-simulator.md](contributing/extending-the-simulator.md)
- Source-to-doc coverage matrix: [docs/reference/symbol-coverage-matrix.md](reference/symbol-coverage-matrix.md)
- Coverage audit checklist: [docs/reference/coverage-audit.md](reference/coverage-audit.md)

## Coverage Policy
The docs are intentionally exhaustive. Every function, constant, type/interface, composable, computed value, watch handler, and event handler in `src/` must be represented by at least one documentation entry.

## Quick Workflow
1. Read the Beginner Primer pages.
2. Trace behavior through the module docs for the area you are changing.
3. Use the extension guide before introducing new opcode/hazard/UI behavior.
4. Update the symbol coverage matrix whenever symbols are added/removed/renamed.
