import { createInitialMachineState } from "../simulator/initialState";
import type { MachineState } from "../simulator/types";

export interface VisualizerUiState {
  isRunning: boolean;
  tickMs: number;
  selectedCycle: number;
  machine: MachineState;
}

export function createInitialUiState(): VisualizerUiState {
  return {
    isRunning: false,
    tickMs: 400,
    selectedCycle: 0,
    machine: createInitialMachineState(),
  };
}
