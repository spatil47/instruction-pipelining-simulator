import {
  DEFAULT_SIMULATION_CONFIG,
  createEmptyPipelineState,
  createZeroedRegisterFile,
} from "./config";
import type { Instruction, MachineState } from "./types";

// Default demo: shows load-use stall (LW→ADD), MEM→EX forwarding (ADD→ADD),
// an independent instruction that runs in parallel, and a store.
export const DEFAULT_DEMO_PROGRAM: Instruction[] = [
  {
    id: 1,
    opcode: "LW",
    dst: "R1",
    src1: "R0",
    immediate: 0,
    rawText: "LW R1, 0(R0)", // load R1 from Mem[0] — triggers load-use if followed immediately
  },
  {
    id: 2,
    opcode: "ADDI",
    dst: "R6",
    src1: "R0",
    immediate: 10,
    rawText: "ADDI R6, R0, 10", // independent: fills load-use slot with useful work
  },
  {
    id: 3,
    opcode: "ADD",
    dst: "R2",
    src1: "R1",
    src2: "R6",
    rawText: "ADD R2, R1, R6", // RAW on R1 (from LW) and R6 (from ADDI) — forwarding resolves R6
  },
  {
    id: 4,
    opcode: "ADD",
    dst: "R3",
    src1: "R2",
    src2: "R6",
    rawText: "ADD R3, R2, R6", // RAW on R2 (from ADD above) — MEM→EX forwarding
  },
  {
    id: 5,
    opcode: "SW",
    src1: "R0",
    src2: "R3",
    immediate: 4,
    rawText: "SW R3, 4(R0)", // store result to Mem[4]
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
    transientResults: {},
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
