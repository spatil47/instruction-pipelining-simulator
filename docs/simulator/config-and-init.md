# Config and Init Guide

Source of truth for API contracts:
- `src/simulator/config.ts`
- `src/simulator/initialState.ts`

## What These Modules Own
- Default simulation feature flags.
- Empty pipeline/register-file constructors.
- Default demo program and fresh machine bootstrap.

## Public API Summary
- From `config.ts`:
  - `DEFAULT_SIMULATION_CONFIG`
  - `createEmptyStage(stage)`
  - `createEmptyPipelineState()`
  - `createZeroedRegisterFile(registerCount?)`
- From `initialState.ts`:
  - `DEFAULT_DEMO_PROGRAM`
  - `createInitialMachineState(program?)`

## Behavioral Notes
- Default config enables forwarding plus RAW/load-use detection.
- `createInitialMachineState` clones config defaults into each new machine.
- Demo program is intentionally chosen to surface hazard and forwarding behavior in UI.

## Related Docs
- Shared contracts: [docs/simulator/types.md](../simulator/types.md)
- Runtime execution: [docs/simulator/engine.md](../simulator/engine.md)
- UI orchestration: [docs/ui/state.md](../ui/state.md)