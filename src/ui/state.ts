import { isMachineComplete, tickMachine } from "../simulator/engine";
import {
  createInitialMachineState,
  DEFAULT_DEMO_PROGRAM,
} from "../simulator/initialState";
import type { ParseError } from "../simulator/parser";
import { parseProgram } from "../simulator/parser";
import type { MachineState, SimulationConfig } from "../simulator/types";

/**
 * Mutable UI session state that orchestrates simulator playback and editing.
 */
export interface VisualizerUiState {
  isRunning: boolean;
  tickMs: number;
  /** Index into machine.history (1-based cycle number), or null = live/latest */
  selectedCycle: number | null;
  machine: MachineState;
  programText: string;
  parseErrors: ParseError[];
  intervalId: ReturnType<typeof setInterval> | null;
}

function defaultProgramText(): string {
  return DEFAULT_DEMO_PROGRAM.map((i) => i.rawText).join("\n");
}

/**
 * Creates the initial UI state bound to a fresh machine.
 */
export function createInitialUiState(): VisualizerUiState {
  return {
    isRunning: false,
    tickMs: 600,
    selectedCycle: null,
    machine: createInitialMachineState(),
    programText: defaultProgramText(),
    parseErrors: [],
    intervalId: null,
  };
}

/**
 * Advances the simulation by one cycle while keeping the timeline in live mode.
 *
 * @param state Mutable UI state object.
 */
export function stepForward(state: VisualizerUiState): void {
  if (isMachineComplete(state.machine)) {
    return;
  }

  state.machine = tickMachine(state.machine);
  // Step always advances the live machine; snap timeline back to live.
  state.selectedCycle = null;
}

/**
 * Rebuilds machine state from the current editor program text.
 *
 * On parse errors, a safe default program is loaded and diagnostics are kept.
 *
 * @param state Mutable UI state object.
 */
export function resetSimulation(state: VisualizerUiState): void {
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.isRunning = false;
  }
  const { instructions, errors } = parseProgram(state.programText);
  state.parseErrors = errors;
  if (errors.length === 0) {
    state.machine = createInitialMachineState(
      instructions.length > 0 ? instructions : undefined,
    );
  } else {
    state.machine = createInitialMachineState();
  }
  state.selectedCycle = null;
}

/**
 * Starts timed playback until completion or explicit stop.
 *
 * @param state Mutable UI state object.
 */
export function startPlay(state: VisualizerUiState): void {
  if (state.isRunning || isMachineComplete(state.machine)) return;
  // Playback is always tied to the latest cycle, not a scrubbed historical one.
  state.selectedCycle = null;
  state.isRunning = true;
  state.intervalId = setInterval(() => {
    state.machine = tickMachine(state.machine);
    if (isMachineComplete(state.machine)) {
      stopPlay(state);
    }
  }, state.tickMs);
}

/**
 * Stops timed playback and clears any active interval handle.
 *
 * @param state Mutable UI state object.
 */
export function stopPlay(state: VisualizerUiState): void {
  if (!state.isRunning) return;
  state.isRunning = false;
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

/**
 * Parses and applies editor program text without mutating machine state on error.
 *
 * @param state Mutable UI state object.
 */
export function applyProgram(state: VisualizerUiState): void {
  const { instructions, errors } = parseProgram(state.programText);
  state.parseErrors = errors;
  if (errors.length > 0) return;
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.isRunning = false;
  }
  state.machine = createInitialMachineState(
    instructions.length > 0 ? instructions : undefined,
  );
  state.selectedCycle = null;
}

/**
 * Applies a partial runtime config and rebuilds machine history for consistency.
 *
 * @param state Mutable UI state object.
 * @param config Partial simulator config override.
 */
export function applyConfig(
  state: VisualizerUiState,
  config: Partial<SimulationConfig>,
): void {
  const wasRunning = state.isRunning;
  stopPlay(state);
  // Rebuild simulation with updated config so history is consistent.
  const program = state.machine.program;
  state.machine = createInitialMachineState(program);
  state.machine.config = { ...state.machine.config, ...config };
  state.selectedCycle = null;
  if (wasRunning) startPlay(state);
}
