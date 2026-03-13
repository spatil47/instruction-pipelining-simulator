# Symbol Coverage Matrix

This matrix tracks documentation coverage for all source symbols in `src/`.

## Legend
- Kind: const, type, interface, function, computed, watcher, handler, component
- Visibility: exported or internal (module-local)

## Simulator

### `src/simulator/types.ts`
- `PIPELINE_STAGES` (const, exported) -> `docs/simulator/types.md`
- `PipelineStage` (type, exported) -> `docs/simulator/types.md`
- `Opcode` (type, exported) -> `docs/simulator/types.md`
- `RegisterName` (type, exported) -> `docs/simulator/types.md`
- `Instruction` (interface, exported) -> `docs/simulator/types.md`
- `StageState` (interface, exported) -> `docs/simulator/types.md`
- `PipelineState` (type, exported) -> `docs/simulator/types.md`
- `RegisterFile` (type, exported) -> `docs/simulator/types.md`
- `HazardEvent` (interface, exported) -> `docs/simulator/types.md`
- `ForwardingEvent` (interface, exported) -> `docs/simulator/types.md`
- `MemoryDelta` (interface, exported) -> `docs/simulator/types.md`
- `CycleSnapshot` (interface, exported) -> `docs/simulator/types.md`
- `DerivedMetrics` (interface, exported) -> `docs/simulator/types.md`
- `SimulationConfig` (interface, exported) -> `docs/simulator/types.md`
- `MachineState` (interface, exported) -> `docs/simulator/types.md`

### `src/simulator/config.ts`
- `DEFAULT_SIMULATION_CONFIG` (const, exported) -> `docs/simulator/config-and-init.md`
- `createEmptyStage` (function, exported) -> `docs/simulator/config-and-init.md`
- `createEmptyPipelineState` (function, exported) -> `docs/simulator/config-and-init.md`
- `createZeroedRegisterFile` (function, exported) -> `docs/simulator/config-and-init.md`

### `src/simulator/initialState.ts`
- `DEFAULT_DEMO_PROGRAM` (const, exported) -> `docs/simulator/config-and-init.md`
- `createInitialMachineState` (function, exported) -> `docs/simulator/config-and-init.md`

### `src/simulator/parser.ts`
- `ParseError` (interface, exported) -> `docs/simulator/parser.md`
- `ParseProgramResult` (interface, exported) -> `docs/simulator/parser.md`
- `OPCODE_SET` (const, internal) -> `docs/simulator/parser.md`
- `REGISTER_PATTERN` (const, internal) -> `docs/simulator/parser.md`
- `MEMORY_PATTERN` (const, internal) -> `docs/simulator/parser.md`
- `parseRegister` (function, internal) -> `docs/simulator/parser.md`
- `parseOpcode` (function, internal) -> `docs/simulator/parser.md`
- `parseImmediate` (function, internal) -> `docs/simulator/parser.md`
- `splitInstruction` (function, internal) -> `docs/simulator/parser.md`
- `parseRType` (function, internal) -> `docs/simulator/parser.md`
- `parseAddi` (function, internal) -> `docs/simulator/parser.md`
- `parseLoadStore` (function, internal) -> `docs/simulator/parser.md`
- `parseProgram` (function, exported) -> `docs/simulator/parser.md`

### `src/simulator/engine.ts`
- `cloneRegisterFile` (function, internal) -> `docs/simulator/engine.md`
- `clonePipelineState` (function, internal) -> `docs/simulator/engine.md`
- `createStage` (function, internal) -> `docs/simulator/engine.md`
- `getInstructionById` (function, internal) -> `docs/simulator/engine.md`
- `readRegister` (function, internal) -> `docs/simulator/engine.md`
- `executeInstruction` (function, internal) -> `docs/simulator/engine.md`
- `applyWriteBack` (function, internal) -> `docs/simulator/engine.md`
- `createSnapshot` (function, internal) -> `docs/simulator/engine.md`
- `getReadRegisters` (function, internal) -> `docs/simulator/engine.md`
- `getWrittenRegister` (function, internal) -> `docs/simulator/engine.md`
- `isMachineComplete` (function, exported) -> `docs/simulator/engine.md`
- `tickMachine` (function, exported) -> `docs/simulator/engine.md`

## UI and App

### `src/ui/state.ts`
- `VisualizerUiState` (interface, exported) -> `docs/ui/state.md`
- `defaultProgramText` (function, internal) -> `docs/ui/state.md`
- `createInitialUiState` (function, exported) -> `docs/ui/state.md`
- `stepForward` (function, exported) -> `docs/ui/state.md`
- `resetSimulation` (function, exported) -> `docs/ui/state.md`
- `startPlay` (function, exported) -> `docs/ui/state.md`
- `stopPlay` (function, exported) -> `docs/ui/state.md`
- `applyProgram` (function, exported) -> `docs/ui/state.md`
- `applyConfig` (function, exported) -> `docs/ui/state.md`

### `src/ui/useGlossary.ts`
- `activeTerm` (const ref, internal) -> `docs/ui/glossary.md`
- `setActiveTerm` (function, internal) -> `docs/ui/glossary.md`
- `getEntry` (function, internal) -> `docs/ui/glossary.md`
- `useGlossary` (function, exported) -> `docs/ui/glossary.md`

### `src/ui/glossary.ts`
- `GlossaryEntry` (interface, exported) -> `docs/ui/glossary.md`
- `glossary` (const record, internal) -> `docs/ui/glossary.md`
- default export (const export) -> `docs/ui/glossary.md`

### `src/App.vue`
- `ui` (reactive const) -> `docs/ui/app-root.md`
- `onUnmounted` cleanup callback -> `docs/ui/app-root.md`
- tick-speed `watch` handler -> `docs/ui/app-root.md`
- `displayedSnapshot` (computed) -> `docs/ui/app-root.md`
- `displayedStages` (computed) -> `docs/ui/app-root.md`
- `waterfallRows` (computed) -> `docs/ui/app-root.md`
- `cycleNumbers` (computed) -> `docs/ui/app-root.md`
- `nonZeroRegisters` (computed) -> `docs/ui/app-root.md`
- `eventLog` (computed) -> `docs/ui/app-root.md`
- `handlePlayPause` (handler) -> `docs/ui/app-root.md`
- `handleStep` (handler) -> `docs/ui/app-root.md`
- `handleReset` (handler) -> `docs/ui/app-root.md`
- `handleApplyProgram` (handler) -> `docs/ui/app-root.md`
- `handleConfigChange` (handler) -> `docs/ui/app-root.md`
- `scrubberMax` (computed) -> `docs/ui/app-root.md`
- `scrubberValue` get/set (computed) -> `docs/ui/app-root.md`
- `displayedCycle` (computed) -> `docs/ui/app-root.md`

## Components

### `src/components/GlossaryTooltip.vue`
- `props` (defineProps) -> `docs/components/components-reference.md`
- `entry` (computed) -> `docs/components/components-reference.md`
- `isHovered` (ref const) -> `docs/components/components-reference.md`
- `wrapperEl` (ref const) -> `docs/components/components-reference.md`
- `flipBelow` (ref const) -> `docs/components/components-reference.md`
- `handleMouseEnter` (function) -> `docs/components/components-reference.md`
- `handleMouseLeave` (function) -> `docs/components/components-reference.md`
- `handleClick` (function) -> `docs/components/components-reference.md`
- `tooltipId` (computed) -> `docs/components/components-reference.md`

### `src/components/GlossaryPanel.vue`
- `entry` (computed) -> `docs/components/components-reference.md`
- `isOpen` (computed) -> `docs/components/components-reference.md`
- `close` (function) -> `docs/components/components-reference.md`
- `handleKeydown` (function) -> `docs/components/components-reference.md`
- `onMounted` listener setup -> `docs/components/components-reference.md`
- `onUnmounted` listener cleanup -> `docs/components/components-reference.md`

### `src/components/InstructionText.vue`
- `props` (defineProps) -> `docs/components/components-reference.md`
- `parsed` (computed) -> `docs/components/components-reference.md`

### `src/components/EventLogEntry.vue`
- `props` (defineProps) -> `docs/components/components-reference.md`
- `parts` (computed) -> `docs/components/components-reference.md`

### `src/components/HelloWorld.vue`
- `count` (ref const) -> `docs/components/components-reference.md`
- status and role note -> `docs/components/components-reference.md`

## Remaining Source Files

### `src/main.ts`
- bootstrap invocation (`createApp(App).mount('#app')`) -> `docs/components/components-reference.md`

### `src/style.css`
- global styles and responsive tokens are covered contextually in `docs/ui/app-root.md`.

### `src/vite-env.d.ts`
- environment typing shim; no runtime symbols to document.
