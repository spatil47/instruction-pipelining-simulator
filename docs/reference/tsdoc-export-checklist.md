# TSDoc Export Checklist

This checklist tracks contract-level TSDoc/JSDoc coverage for every exported symbol in src.

## Simulator

### src/simulator/config.ts
- [ ] DEFAULT_SIMULATION_CONFIG
- [ ] createEmptyStage
- [ ] createEmptyPipelineState
- [ ] createZeroedRegisterFile

### src/simulator/types.ts
- [ ] PIPELINE_STAGES
- [ ] PipelineStage
- [ ] Opcode
- [ ] RegisterName
- [ ] Instruction
- [ ] StageState
- [ ] PipelineState
- [ ] RegisterFile
- [ ] HazardEvent
- [ ] ForwardingEvent
- [ ] MemoryDelta
- [ ] CycleSnapshot
- [ ] DerivedMetrics
- [ ] SimulationConfig
- [ ] MachineState

### src/simulator/parser.ts
- [ ] ParseError
- [ ] ParseProgramResult
- [ ] parseProgram

### src/simulator/engine.ts
- [ ] isMachineComplete
- [ ] tickMachine

### src/simulator/initialState.ts
- [ ] DEFAULT_DEMO_PROGRAM
- [ ] createInitialMachineState

## UI

### src/ui/state.ts
- [ ] VisualizerUiState
- [ ] createInitialUiState
- [ ] stepForward
- [ ] resetSimulation
- [ ] startPlay
- [ ] stopPlay
- [ ] applyProgram
- [ ] applyConfig

### src/ui/glossary.ts
- [ ] GlossaryEntry
- [ ] default glossary export

### src/ui/useGlossary.ts
- [ ] useGlossary

## Verification Notes
- Contract format is concise and focused on public behavior.
- Non-obvious internals are selectively documented in parser and engine.
- API docs pages in docs/simulator and docs/ui should summarize behavior and link to source for canonical contracts.
