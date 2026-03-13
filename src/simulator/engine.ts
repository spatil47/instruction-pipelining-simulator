import type {
  CycleSnapshot,
  Instruction,
  MachineState,
  MemoryDelta,
  PipelineStage,
  PipelineState,
  RegisterFile,
  StageState,
} from "./types";

function cloneRegisterFile(registerFile: RegisterFile): RegisterFile {
  return { ...registerFile };
}

function clonePipelineState(stages: PipelineState): PipelineState {
  return {
    IF: { ...stages.IF },
    ID: { ...stages.ID },
    EX: { ...stages.EX },
    MEM: { ...stages.MEM },
    WB: { ...stages.WB },
  };
}

function createStage(stage: PipelineStage, instructionId: number | null, isBubble = false): StageState {
  return {
    stage,
    instructionId,
    isBubble,
  };
}

function getInstructionById(program: Instruction[], instructionId: number | null): Instruction | null {
  if (instructionId === null) {
    return null;
  }

  return program.find((instruction) => instruction.id === instructionId) ?? null;
}

function readRegister(registerFile: RegisterFile, registerName: Instruction["src1"] | Instruction["src2"]): number {
  if (!registerName) {
    return 0;
  }

  return registerFile[registerName] ?? 0;
}

function executeInstruction(instruction: Instruction, registerFile: RegisterFile): number {
  const src1Value = readRegister(registerFile, instruction.src1);
  const src2Value = readRegister(registerFile, instruction.src2);

  switch (instruction.opcode) {
    case "ADD":
      return src1Value + src2Value;
    case "SUB":
      return src1Value - src2Value;
    case "AND":
      return src1Value & src2Value;
    case "OR":
      return src1Value | src2Value;
    case "XOR":
      return src1Value ^ src2Value;
    case "ADDI":
      return src1Value + (instruction.immediate ?? 0);
    case "LW":
    case "SW":
      return src1Value + (instruction.immediate ?? 0);
    case "NOP":
      return 0;
  }
}

function applyWriteBack(
  instruction: Instruction,
  registerFile: RegisterFile,
  transientResults: Record<number, number>,
): void {
  if (!instruction.dst) {
    return;
  }

  if (instruction.opcode === "SW" || instruction.opcode === "NOP") {
    return;
  }

  if (instruction.dst === "R0") {
    return;
  }

  const result = transientResults[instruction.id] ?? 0;
  registerFile[instruction.dst] = result;
}

function createSnapshot(
  cycle: number,
  pc: number,
  stages: PipelineState,
  registerFile: RegisterFile,
  memoryDeltas: MemoryDelta[],
): CycleSnapshot {
  return {
    cycle,
    pc,
    stages: clonePipelineState(stages),
    registerFile: cloneRegisterFile(registerFile),
    memoryDeltas,
    hazards: [],
    forwarding: [],
  };
}

export function tickMachine(current: MachineState): MachineState {
  const nextCycle = current.cycle + 1;
  const nextRegisterFile = cloneRegisterFile(current.registerFile);
  const nextMemory = { ...current.memory };
  const nextTransientResults = { ...current.transientResults };
  const memoryDeltas: MemoryDelta[] = [];

  const wbInstruction = getInstructionById(current.program, current.stages.WB.instructionId);
  if (wbInstruction) {
    applyWriteBack(wbInstruction, nextRegisterFile, nextTransientResults);
    delete nextTransientResults[wbInstruction.id];
  }

  const memInstruction = getInstructionById(current.program, current.stages.MEM.instructionId);
  if (memInstruction?.opcode === "LW") {
    const address = nextTransientResults[memInstruction.id] ?? 0;
    nextTransientResults[memInstruction.id] = nextMemory[address] ?? 0;
  }

  if (memInstruction?.opcode === "SW") {
    const address = nextTransientResults[memInstruction.id] ?? 0;
    const before = nextMemory[address] ?? 0;
    const after = readRegister(nextRegisterFile, memInstruction.src2);
    nextMemory[address] = after;
    memoryDeltas.push({ address, before, after });
    delete nextTransientResults[memInstruction.id];
  }

  const exInstruction = getInstructionById(current.program, current.stages.EX.instructionId);
  if (exInstruction) {
    nextTransientResults[exInstruction.id] = executeInstruction(exInstruction, nextRegisterFile);
  }

  const fetchedInstruction = current.program[current.pc] ?? null;
  const nextPc = fetchedInstruction ? current.pc + 1 : current.pc;

  const nextStages: PipelineState = {
    WB: createStage("WB", current.stages.MEM.instructionId),
    MEM: createStage("MEM", current.stages.EX.instructionId),
    EX: createStage("EX", current.stages.ID.instructionId),
    ID: createStage("ID", current.stages.IF.instructionId),
    IF: createStage("IF", fetchedInstruction?.id ?? null),
  };

  const committedThisCycle = wbInstruction && wbInstruction.opcode !== "NOP" ? 1 : 0;
  const committedInstructions = current.metrics.committedInstructions + committedThisCycle;
  const cycles = current.metrics.cycles + 1;

  const snapshot = createSnapshot(nextCycle, nextPc, nextStages, nextRegisterFile, memoryDeltas);
  const history = [...current.history, snapshot];

  return {
    ...current,
    cycle: nextCycle,
    pc: nextPc,
    stages: nextStages,
    transientResults: nextTransientResults,
    registerFile: nextRegisterFile,
    memory: nextMemory,
    history,
    metrics: {
      ...current.metrics,
      cycles,
      committedInstructions,
      cpi: committedInstructions === 0 ? 0 : cycles / committedInstructions,
      bubbleCount: current.metrics.bubbleCount + Object.values(nextStages).filter((stage) => stage.isBubble).length,
    },
  };
}
