# Runtime Flow and Lifecycle

## Beginner Primer
The simulator advances in discrete ticks. Each tick emulates one hardware clock cycle. In each cycle, work happens in this order:
1. WB commits register writes.
2. MEM performs loads/stores.
3. EX performs ALU/address calculation (with forwarding when available).
4. ID checks hazards and may stall.
5. IF fetches next instruction if not stalled.

This strict order is why behavior is deterministic and replayable.

## Practical Deep Dive

### Tick Lifecycle
```mermaid
flowchart TD
  Start[Input MachineState] --> WB[Write Back stage]
  WB --> MEM[Memory stage]
  MEM --> EX[Execute stage]
  EX --> ID[Decode + hazard checks]
  ID --> Stall{Should stall?}
  Stall -- Yes --> Bubble[Insert EX bubble and hold IF/ID]
  Stall -- No --> Advance[Advance IF->ID->EX->MEM->WB]
  Bubble --> Metrics[Update metrics]
  Advance --> Metrics
  Metrics --> Snapshot[Create and append CycleSnapshot]
  Snapshot --> End[Return next MachineState]
```

### UI Lifecycle State Machine
```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Running: startPlay
  Running --> Idle: stopPlay
  Running --> Idle: completion reached
  Idle --> Idle: stepForward
  Idle --> Idle: applyProgram
  Idle --> Idle: resetSimulation
  Running --> Running: tick interval
  Running --> Running: speed change -> restart interval
  Idle --> Scrubbed: timeline moved left
  Scrubbed --> Idle: LIVE selected
```

### Controls to State Function Mapping
- Play/Pause button: `handlePlayPause` -> `startPlay` or `stopPlay`.
- Step button: `handleStep` -> `stopPlay` then `stepForward`.
- Reset button: `handleReset` -> `resetSimulation`.
- Apply button: `handleApplyProgram` -> `applyProgram`.
- Config toggles: `handleConfigChange` -> `applyConfig`.
- Timeline range input: `scrubberValue` computed setter updates `selectedCycle`.

### Snapshot and Rendering Flow
```mermaid
flowchart LR
  Tick[tickMachine] --> Snapshot[CycleSnapshot]
  Snapshot --> History[machine.history append]
  History --> Display[displayedSnapshot computed]
  Display --> Stages[displayedStages]
  History --> Waterfall[waterfallRows]
  History --> Events[eventLog]
  Display --> Registers[nonZeroRegisters]
```

## Hazard and Forwarding Evaluation Details
1. Load-use hazard checks ID consumers against EX load destination.
2. RAW hazard checks pending EX/MEM writes when forwarding is disabled.
3. Stall path injects bubble into EX and holds IF/ID.
4. Forwarding events are recorded and surfaced in overlays and event logs.

## Completion Criteria
A run is complete only when both are true:
1. `pc >= program.length`
2. all pipeline stages are empty

`isMachineComplete` enforces these jointly.
