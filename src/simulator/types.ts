/** Canonical stage order used by pipeline constructors and UI rendering. */
export const PIPELINE_STAGES = ["IF", "ID", "EX", "MEM", "WB"] as const;

/** Union of the simulator's fixed five pipeline stage identifiers. */
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Supported instruction opcodes for parser and execution engine dispatch. */
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

/**
 * Register token used across state and events.
 *
 * Runtime parsing currently constrains this to R0..R31.
 */
export type RegisterName = `R${number}`;

/** Normalized instruction shape produced by parsing and consumed by execution. */
export interface Instruction {
  id: number;
  opcode: Opcode;
  dst?: RegisterName;
  src1?: RegisterName;
  src2?: RegisterName;
  immediate?: number;
  /** Reserved for future pre-decoded address information. */
  memoryAddress?: number;
  rawText: string;
}

/** Occupancy metadata for one pipeline slot in a given cycle. */
export interface StageState {
  stage: PipelineStage;
  instructionId: number | null;
  isBubble: boolean;
}

/** Full five-stage occupancy record keyed by stage identifier. */
export type PipelineState = Record<PipelineStage, StageState>;

/** Integer register value map keyed by logical register name. */
export type RegisterFile = Record<RegisterName, number>;

/**
 * Hazard record emitted for timeline/event-log visualization.
 *
 * `STRUCTURAL` is reserved for future hazard modeling and may not be emitted
 * by the current engine implementation.
 */
export interface HazardEvent {
  cycle: number;
  type: "RAW" | "LOAD_USE" | "STRUCTURAL";
  stage: PipelineStage;
  description: string;
  blockingInstructionId?: number;
  blockedInstructionId?: number;
}

/** Data-forwarding trace between producer/consumer stages for one cycle. */
export interface ForwardingEvent {
  cycle: number;
  fromStage: Extract<PipelineStage, "EX" | "MEM" | "WB">;
  toStage: Extract<PipelineStage, "ID" | "EX">;
  register: RegisterName;
  value: number;
}

/** Single memory cell write delta captured during a cycle transition. */
export interface MemoryDelta {
  address: number;
  before: number;
  after: number;
}

/** Immutable per-cycle snapshot used by timeline scrubbing and diagnostics. */
export interface CycleSnapshot {
  cycle: number;
  pc: number;
  stages: PipelineState;
  registerFile: RegisterFile;
  memoryDeltas: MemoryDelta[];
  hazards: HazardEvent[];
  forwarding: ForwardingEvent[];
}

/** Aggregated runtime counters derived as simulation advances. */
export interface DerivedMetrics {
  cycles: number;
  committedInstructions: number;
  cpi: number;
  stallCount: number;
  bubbleCount: number;
  forwardingCount: number;
}

/**
 * Runtime toggles that alter hazard and forwarding behavior.
 *
 * Callers should treat new fields as forward-compatible and merge unknown keys.
 */
export interface SimulationConfig {
  enableForwarding: boolean;
  detectRawHazards: boolean;
  detectLoadUseHazards: boolean;
}

/** Complete simulator state for deterministic cycle-to-cycle transitions. */
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
