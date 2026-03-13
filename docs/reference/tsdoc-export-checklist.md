# TSDoc Export Checklist

This checklist tracks contract-level TSDoc/JSDoc coverage for every exported symbol in src.

## Simulator

### src/simulator/config.ts
- [x] DEFAULT_SIMULATION_CONFIG
- [x] createEmptyStage
- [x] createEmptyPipelineState
- [x] createZeroedRegisterFile

### src/simulator/types.ts
- [x] PIPELINE_STAGES
- [x] PipelineStage
- [x] Opcode
- [x] RegisterName
- [x] Instruction
- [x] StageState
- [x] PipelineState
- [x] RegisterFile
- [x] HazardEvent
- [x] ForwardingEvent
- [x] MemoryDelta
- [x] CycleSnapshot
- [x] DerivedMetrics
- [x] SimulationConfig
- [x] MachineState

### src/simulator/parser.ts
- [x] ParseError
- [x] ParseProgramResult
- [x] parseProgram

### src/simulator/engine.ts
- [x] isMachineComplete
- [x] tickMachine

### src/simulator/initialState.ts
- [x] DEFAULT_DEMO_PROGRAM
- [x] createInitialMachineState

## UI

### src/ui/state.ts
- [x] VisualizerUiState
- [x] createInitialUiState
- [x] stepForward
- [x] resetSimulation
- [x] startPlay
- [x] stopPlay
- [x] applyProgram
- [x] applyConfig

### src/ui/glossary.ts
- [x] GlossaryEntry
- [x] default glossary export

### src/ui/useGlossary.ts
- [x] useGlossary

## Verification Notes
- Contract format is concise and focused on public behavior.
- Non-obvious internals are selectively documented in parser and engine.
- API docs pages in docs/simulator and docs/ui should summarize behavior and link to source for canonical contracts.
