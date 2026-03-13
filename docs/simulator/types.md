# Simulator Types Guide

Source of truth for API contracts: `src/simulator/types.ts` (TSDoc on exports).

## What This Module Owns
- Canonical type vocabulary shared by parser, engine, and UI.
- Stage/opcode/register domains.
- Snapshot, event, config, metrics, and top-level machine state contracts.

## Core Export Groups
- Stage and opcode domain:
  - `PIPELINE_STAGES`, `PipelineStage`, `Opcode`
- Instruction and storage shapes:
  - `Instruction`, `RegisterName`, `RegisterFile`, `PipelineState`, `StageState`
- Runtime telemetry:
  - `HazardEvent`, `ForwardingEvent`, `MemoryDelta`, `CycleSnapshot`, `DerivedMetrics`
- Config and top-level state:
  - `SimulationConfig`, `MachineState`

## Forward-Compatibility Notes
- `Instruction.memoryAddress` is reserved for future pre-decoded address metadata.
- `HazardEvent.type` includes `STRUCTURAL` for future hazard modeling.
- `SimulationConfig` should be merged by callers so additional flags can be introduced safely.

## Related Docs
- Runtime transitions: [docs/simulator/engine.md](../simulator/engine.md)
- Config/init defaults: [docs/simulator/config-and-init.md](../simulator/config-and-init.md)