import type {
  PipelineState,
  RegisterFile,
  SimulationConfig,
  StageState,
} from "./types";
import { PIPELINE_STAGES } from "./types";

/**
 * Default runtime toggles for hazard detection and forwarding behavior.
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  enableForwarding: true,
  detectRawHazards: true,
  detectLoadUseHazards: true,
};

/**
 * Creates an empty pipeline stage slot.
 *
 * @param stage Stage key to assign to the slot.
 * @returns Empty stage state with no instruction and no bubble marker.
 */
export function createEmptyStage(stage: StageState["stage"]): StageState {
  return {
    stage,
    instructionId: null,
    isBubble: false,
  };
}

/**
 * Creates a fully empty pipeline state in canonical IF->WB order.
 *
 * @returns Stage map with all instruction IDs cleared.
 */
export function createEmptyPipelineState(): PipelineState {
  return {
    IF: createEmptyStage(PIPELINE_STAGES[0]),
    ID: createEmptyStage(PIPELINE_STAGES[1]),
    EX: createEmptyStage(PIPELINE_STAGES[2]),
    MEM: createEmptyStage(PIPELINE_STAGES[3]),
    WB: createEmptyStage(PIPELINE_STAGES[4]),
  };
}

/**
 * Creates a register file initialized to zero for keys R0..R{registerCount-1}.
 *
 * @param registerCount Number of logical register keys to pre-allocate.
 * @returns Register record with every key initialized to 0.
 */
export function createZeroedRegisterFile(registerCount = 32): RegisterFile {
  const registerFile = {} as RegisterFile;

  for (let index = 0; index < registerCount; index += 1) {
    registerFile[`R${index}`] = 0;
  }

  return registerFile;
}
