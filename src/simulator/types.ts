export const PIPELINE_STAGES = ["IF", "ID", "EX", "MEM", "WB"] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type Opcode =
  | "ADD"
  | "SUB"
  | "AND"
  | "OR"
  | "XOR"
  | "ADDI"
  | "LW"
  | "SW"
  | "NOP";

export type RegisterName = `R${number}`;

export interface Instruction {
  id: number;
  opcode: Opcode;
  dst?: RegisterName;
  src1?: RegisterName;
  src2?: RegisterName;
  immediate?: number;
  memoryAddress?: number;
  rawText: string;
}

export interface StageState {
  stage: PipelineStage;
  instructionId: number | null;
  isBubble: boolean;
}

export type PipelineState = Record<PipelineStage, StageState>;

export type RegisterFile = Record<RegisterName, number>;

export interface HazardEvent {
  cycle: number;
  type: "RAW" | "LOAD_USE" | "STRUCTURAL";
  stage: PipelineStage;
  description: string;
  blockingInstructionId?: number;
  blockedInstructionId?: number;
}

export interface ForwardingEvent {
  cycle: number;
  fromStage: Extract<PipelineStage, "EX" | "MEM" | "WB">;
  toStage: Extract<PipelineStage, "ID" | "EX">;
  register: RegisterName;
  value: number;
}

export interface MemoryDelta {
  address: number;
  before: number;
  after: number;
}

export interface CycleSnapshot {
  cycle: number;
  pc: number;
  stages: PipelineState;
  registerFile: RegisterFile;
  memoryDeltas: MemoryDelta[];
  hazards: HazardEvent[];
  forwarding: ForwardingEvent[];
}

export interface DerivedMetrics {
  cycles: number;
  committedInstructions: number;
  cpi: number;
  stallCount: number;
  bubbleCount: number;
  forwardingCount: number;
}

export interface SimulationConfig {
  enableForwarding: boolean;
  detectRawHazards: boolean;
  detectLoadUseHazards: boolean;
}

export interface MachineState {
  cycle: number;
  pc: number;
  program: Instruction[];
  stages: PipelineState;
  transientResults: Record<number, number>;
  registerFile: RegisterFile;
  memory: Record<number, number>;
  history: CycleSnapshot[];
  metrics: DerivedMetrics;
  config: SimulationConfig;
}
