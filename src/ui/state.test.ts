import { afterEach, describe, expect, it, vi } from "vitest";

import { isMachineComplete } from "../simulator/engine";
import { createInitialMachineState } from "../simulator/initialState";
import { parseProgram } from "../simulator/parser";
import type { Instruction } from "../simulator/types";
import { createInitialUiState, startPlay, stepForward } from "./state";

function makeProgram(lines: string): Instruction[] {
  const { instructions, errors } = parseProgram(lines);
  if (errors.length > 0) {
    throw new Error(`Parse errors: ${errors.map((e) => e.message).join(", ")}`);
  }
  return instructions;
}

function stepUntilComplete(
  maxSteps: number,
): ReturnType<typeof createInitialUiState> {
  const state = createInitialUiState();
  state.machine = createInitialMachineState(makeProgram("ADD R1, R2, R3"));

  for (let i = 0; i < maxSteps && !isMachineComplete(state.machine); i++) {
    stepForward(state);
  }

  return state;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ui state completion behavior", () => {
  it("stepForward is a no-op after program completion", () => {
    const state = stepUntilComplete(20);
    expect(isMachineComplete(state.machine)).toBe(true);

    const cycleBefore = state.machine.cycle;
    const historyLengthBefore = state.machine.history.length;

    stepForward(state);

    expect(state.machine.cycle).toBe(cycleBefore);
    expect(state.machine.history).toHaveLength(historyLengthBefore);
  });

  it("startPlay does not start when machine is already complete", () => {
    const state = stepUntilComplete(20);
    expect(isMachineComplete(state.machine)).toBe(true);

    startPlay(state);

    expect(state.isRunning).toBe(false);
    expect(state.intervalId).toBeNull();
  });

  it("startPlay auto-stops once the machine completes", () => {
    vi.useFakeTimers();

    const state = createInitialUiState();
    state.machine = createInitialMachineState(makeProgram("ADD R1, R2, R3"));
    state.tickMs = 1;

    startPlay(state);
    expect(state.isRunning).toBe(true);

    for (let i = 0; i < 20 && state.isRunning; i++) {
      vi.advanceTimersByTime(1);
    }

    expect(isMachineComplete(state.machine)).toBe(true);
    expect(state.isRunning).toBe(false);
    expect(state.intervalId).toBeNull();
  });

  it("stepForward returns timeline selection to live", () => {
    const state = createInitialUiState();
    state.machine = createInitialMachineState(
      makeProgram("ADD R1, R2, R3\nADD R4, R1, R5"),
    );

    stepForward(state);
    stepForward(state);
    const before = state.machine.cycle;

    state.selectedCycle = 1;
    stepForward(state);

    expect(state.machine.cycle).toBe(before + 1);
    expect(state.selectedCycle).toBeNull();
  });

  it("startPlay returns timeline selection to live", () => {
    vi.useFakeTimers();

    const state = createInitialUiState();
    state.machine = createInitialMachineState(
      makeProgram("ADD R1, R2, R3\nADD R4, R1, R5"),
    );
    state.tickMs = 1;

    stepForward(state);
    state.selectedCycle = 1;

    startPlay(state);
    expect(state.isRunning).toBe(true);
    expect(state.selectedCycle).toBeNull();

    vi.advanceTimersByTime(1);
    expect(state.machine.cycle).toBeGreaterThan(1);
  });
});
