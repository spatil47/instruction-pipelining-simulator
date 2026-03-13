# UI State Manager Reference

Source: `src/ui/state.ts`

## Beginner Primer
`VisualizerUiState` is the bridge between simulation logic and Vue rendering. All control actions (play, pause, step, reset, apply) flow through this module.

## Interface: `VisualizerUiState`
- Kind: exported interface
- Fields:
  - `isRunning: boolean` playback active flag
  - `tickMs: number` interval speed in milliseconds
  - `selectedCycle: number | null` selected history cycle, `null` means live/latest
  - `machine: MachineState` current simulation state
  - `programText: string` editable source text in editor
  - `parseErrors: ParseError[]` latest parse diagnostics
  - `intervalId: ReturnType<typeof setInterval> | null` playback timer handle

## Internal Function: `defaultProgramText()`
- Signature:
```ts
defaultProgramText(): string
```
- Purpose: convert `DEFAULT_DEMO_PROGRAM` into newline-separated source text.
- Side effects: none.

## Exported Function: `createInitialUiState()`
- Signature:
```ts
createInitialUiState(): VisualizerUiState
```
- Purpose: create fresh UI state.
- Key defaults:
  - playback off
  - `tickMs = 600`
  - `selectedCycle = null`
  - machine initialized from default simulator state
  - parse errors empty

## Exported Function: `stepForward(state)`
- Signature:
```ts
stepForward(state: VisualizerUiState): void
```
- Purpose: execute one simulation cycle manually.
- Behavior:
  - no-op if machine already complete
  - updates `state.machine = tickMachine(...)`
  - snaps timeline to live view by setting `selectedCycle = null`

## Exported Function: `resetSimulation(state)`
- Signature:
```ts
resetSimulation(state: VisualizerUiState): void
```
- Purpose: full restart from current program text.
- Behavior:
  1. stop active interval if running
  2. parse current `programText`
  3. store parse errors
  4. if parse succeeds: initialize machine with parsed instructions (or default if empty)
  5. if parse fails: initialize default machine
  6. set `selectedCycle = null`

## Exported Function: `startPlay(state)`
- Signature:
```ts
startPlay(state: VisualizerUiState): void
```
- Purpose: start interval-driven playback.
- Guard clauses:
  - returns if already running
  - returns if machine complete
- Behavior:
  - force live timeline (`selectedCycle = null`)
  - create interval that ticks machine every `tickMs`
  - auto-stop when completion reached

## Exported Function: `stopPlay(state)`
- Signature:
```ts
stopPlay(state: VisualizerUiState): void
```
- Purpose: terminate playback interval safely.
- Behavior:
  - returns if not running
  - marks `isRunning = false`
  - clears interval and nulls handle when present

## Exported Function: `applyProgram(state)`
- Signature:
```ts
applyProgram(state: VisualizerUiState): void
```
- Purpose: parse editor text and apply as active program.
- Behavior:
  - parse and store errors
  - if errors exist, return without mutating machine
  - stop running interval if needed
  - reinitialize machine from parsed instructions (or default if empty)
  - reset timeline to live

## Exported Function: `applyConfig(state, config)`
- Signature:
```ts
applyConfig(state: VisualizerUiState, config: Partial<SimulationConfig>): void
```
- Purpose: update simulation config and rebuild state consistently.
- Behavior:
  1. capture previous running status
  2. stop playback
  3. rebuild machine from same program
  4. apply merged config
  5. reset timeline to live
  6. resume playback if previously running
- Important invariant:
  - history is rebuilt/reset after config changes to preserve consistency.

## Control Mapping from `src/App.vue`
- Play/Pause -> `startPlay` / `stopPlay`
- Step -> `stepForward`
- Reset -> `resetSimulation`
- Apply program -> `applyProgram`
- Toggle controls -> `applyConfig`

## Edge Cases
1. Applying program with errors does not alter machine run state except parseErrors.
2. `resetSimulation` falls back to default demo program when parse fails.
3. Manual step while complete is a safe no-op.
4. Playback always runs in live mode, not scrubbed mode.
