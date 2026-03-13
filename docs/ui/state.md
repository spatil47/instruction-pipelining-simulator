# UI State Guide

Source of truth for API contracts: `src/ui/state.ts` (TSDoc on exports).

## What This Module Owns
- Mutable `VisualizerUiState` session container.
- User action handlers for step/play/reset/apply.
- Coordination between parser, machine runtime, and playback interval lifecycle.

## Public API
- `VisualizerUiState`
- `createInitialUiState()`
- `stepForward(state)`
- `resetSimulation(state)`
- `startPlay(state)`
- `stopPlay(state)`
- `applyProgram(state)`
- `applyConfig(state, config)`

## Behavioral Notes
- `selectedCycle = null` always means live/latest timeline view.
- `applyProgram` preserves current machine state when parse errors are present.
- `resetSimulation` falls back to demo program when parsing fails.
- Config changes rebuild machine/history to keep snapshots semantically consistent.

## Related Docs
- Engine runtime: [docs/simulator/engine.md](../simulator/engine.md)
- Parser behavior: [docs/simulator/parser.md](../simulator/parser.md)
- Glossary state: [docs/ui/glossary.md](../ui/glossary.md)