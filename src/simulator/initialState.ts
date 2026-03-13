import {
  DEFAULT_SIMULATION_CONFIG,
  createEmptyPipelineState,
  createZeroedRegisterFile,
} from "./config";
import type { Instruction, MachineState } from "./types";

export const DEFAULT_DEMO_PROGRAM: Instruction[] = [
  {
    id: 1,
    opcode: "LW",
    dst: "R1",
    src1: "R0",
    immediate: 0,
    rawText: "LW R1, 0(R0)",
  },
  {
    id: 2,
    opcode: "ADD",
    dst: "R2",
    src1: "R1",
    src2: "R3",
    rawText: "ADD R2, R1, R3",
  },
  {
    id: 3,
    opcode: "ADD",
    dst: "R4",
    src1: "R2",
    src2: "R5",
    rawText: "ADD R4, R2, R5",
  },
];

export function createInitialMachineState(
  program: Instruction[] = DEFAULT_DEMO_PROGRAM,
): MachineState {
  return {
    cycle: 0,
    pc: 0,
    program,
    stages: createEmptyPipelineState(),
    registerFile: createZeroedRegisterFile(),
    memory: {},
    history: [],
    metrics: {
      cycles: 0,
      committedInstructions: 0,
      cpi: 0,
      stallCount: 0,
      bubbleCount: 0,
      forwardingCount: 0,
    },
    config: { ...DEFAULT_SIMULATION_CONFIG },
  };
}
