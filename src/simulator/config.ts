import type {
  PipelineState,
  RegisterFile,
  SimulationConfig,
  StageState,
} from "./types";
import { PIPELINE_STAGES } from "./types";

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  enableForwarding: true,
  detectRawHazards: true,
  detectLoadUseHazards: true,
};

export function createEmptyStage(stage: StageState["stage"]): StageState {
  return {
    stage,
    instructionId: null,
    isBubble: false,
  };
}

export function createEmptyPipelineState(): PipelineState {
  return {
    IF: createEmptyStage(PIPELINE_STAGES[0]),
    ID: createEmptyStage(PIPELINE_STAGES[1]),
    EX: createEmptyStage(PIPELINE_STAGES[2]),
    MEM: createEmptyStage(PIPELINE_STAGES[3]),
    WB: createEmptyStage(PIPELINE_STAGES[4]),
  };
}

export function createZeroedRegisterFile(registerCount = 32): RegisterFile {
  const registerFile = {} as RegisterFile;

  for (let index = 0; index < registerCount; index += 1) {
    registerFile[`R${index}`] = 0;
  }

  return registerFile;
}
