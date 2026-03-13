import type {
  CycleSnapshot,
  ForwardingEvent,
  HazardEvent,
  Instruction,
  MachineState,
  MemoryDelta,
  PipelineStage,
  PipelineState,
  RegisterFile,
  RegisterName,
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

function createStage(
  stage: PipelineStage,
  instructionId: number | null,
  isBubble = false,
): StageState {
  return {
    stage,
    instructionId,
    isBubble,
  };
}

function getInstructionById(
  program: Instruction[],
  instructionId: number | null,
): Instruction | null {
  if (instructionId === null) {
    return null;
  }

  return (
    program.find((instruction) => instruction.id === instructionId) ?? null
  );
}

function readRegister(
  registerFile: RegisterFile,
  registerName: Instruction["src1"] | Instruction["src2"],
): number {
  if (!registerName) {
    return 0;
  }

  return registerFile[registerName] ?? 0;
}

function executeInstruction(
  instruction: Instruction,
  registerFile: RegisterFile,
  forwardedValues: Partial<Record<string, number>> = {},
): number {
  function readSrc(reg: RegisterName | undefined): number {
    if (!reg) return 0;
    return (
      (reg in forwardedValues ? forwardedValues[reg] : registerFile[reg]) ?? 0
    );
  }

  const src1Value = readSrc(instruction.src1);
  const src2Value = readSrc(instruction.src2);

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
  // Only instructions with register destinations participate in write-back.
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
  hazards: HazardEvent[],
  forwarding: ForwardingEvent[],
): CycleSnapshot {
  return {
    cycle,
    pc,
    stages: clonePipelineState(stages),
    registerFile: cloneRegisterFile(registerFile),
    memoryDeltas,
    hazards,
    forwarding,
  };
}

function getReadRegisters(instruction: Instruction | null): Set<string> {
  if (!instruction) {
    return new Set<string>();
  }

  const reads = new Set<string>();

  if (instruction.src1) {
    reads.add(instruction.src1);
  }

  if (instruction.src2 && instruction.opcode !== "SW") {
    reads.add(instruction.src2);
  }

  if (instruction.opcode === "SW" && instruction.src2) {
    reads.add(instruction.src2);
  }

  return reads;
}

function getWrittenRegister(instruction: Instruction | null): string | null {
  if (
    !instruction?.dst ||
    instruction.opcode === "SW" ||
    instruction.opcode === "NOP"
  ) {
    return null;
  }

  return instruction.dst;
}

/**
 * Returns true when program fetch is exhausted and all pipeline slots are empty.
 *
 * @param machine Full machine state to inspect.
 * @returns Whether simulation can stop without dropping in-flight instructions.
 */
export function isMachineComplete(machine: MachineState): boolean {
  const isProgramExhausted = machine.pc >= machine.program.length;
  const hasInFlightInstruction = Object.values(machine.stages).some(
    (stage) => stage.instructionId !== null,
  );
  return isProgramExhausted && !hasInFlightInstruction;
}

/**
 * Advances the simulator by one deterministic cycle.
 *
 * Cycle order is fixed: write-back, memory, execute, hazard checks, then stage
 * transitions/metrics. The input state is treated as immutable and a new state
 * object is returned.
 *
 * @param current Current machine snapshot.
 * @returns Next machine snapshot after one clock tick.
 */
export function tickMachine(current: MachineState): MachineState {
  const nextCycle = current.cycle + 1;
  const nextRegisterFile = cloneRegisterFile(current.registerFile);
  const nextMemory = { ...current.memory };
  const nextTransientResults = { ...current.transientResults };
  const memoryDeltas: MemoryDelta[] = [];
  const hazards: HazardEvent[] = [];
  const forwardingEvents: ForwardingEvent[] = [];

  const wbInstruction = getInstructionById(
    current.program,
    current.stages.WB.instructionId,
  );
  // Commit first so ID-stage hazard analysis observes WB writes as already visible.
  if (wbInstruction) {
    applyWriteBack(wbInstruction, nextRegisterFile, nextTransientResults);
    delete nextTransientResults[wbInstruction.id];
  }

  const memInstruction = getInstructionById(
    current.program,
    current.stages.MEM.instructionId,
  );
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

  const exInstruction = getInstructionById(
    current.program,
    current.stages.EX.instructionId,
  );

  // Compute MEM→EX forwarding: result computed last cycle (now in MEM) forwarded to EX.
  const forwardedValues: Partial<Record<string, number>> = {};
  if (current.config.enableForwarding && exInstruction) {
    const exReads = getReadRegisters(exInstruction);
    const memWriteDst = getWrittenRegister(memInstruction);
    if (memWriteDst && exReads.has(memWriteDst)) {
      const forwardedValue = nextTransientResults[memInstruction!.id];
      if (forwardedValue !== undefined) {
        forwardedValues[memWriteDst] = forwardedValue;
        forwardingEvents.push({
          cycle: nextCycle,
          fromStage: "MEM",
          toStage: "EX",
          register: memWriteDst as RegisterName,
          value: forwardedValue,
        });
      }
    }
  }

  if (exInstruction) {
    nextTransientResults[exInstruction.id] = executeInstruction(
      exInstruction,
      nextRegisterFile,
      forwardedValues,
    );
  }

  const idInstruction = getInstructionById(
    current.program,
    current.stages.ID.instructionId,
  );
  const idReads = getReadRegisters(idInstruction);
  const exWriteRegister = getWrittenRegister(exInstruction);
  const memWriteRegister = getWrittenRegister(memInstruction);

  const hasLoadUseHazard =
    current.config.detectLoadUseHazards &&
    exInstruction?.opcode === "LW" &&
    !!exWriteRegister &&
    idReads.has(exWriteRegister);

  // Only stall for EX and MEM pending writes; WB already committed to registerFile at step 1.
  const hasRawHazardWithoutForwarding =
    current.config.detectRawHazards &&
    !current.config.enableForwarding &&
    [exWriteRegister, memWriteRegister].some(
      (pendingWrite) => !!pendingWrite && idReads.has(pendingWrite),
    );

  const shouldStall = hasLoadUseHazard || hasRawHazardWithoutForwarding;

  if (hasLoadUseHazard && exInstruction && idInstruction) {
    hazards.push({
      cycle: nextCycle,
      type: "LOAD_USE",
      stage: "ID",
      description: "Load-use dependency detected; inserted stall bubble.",
      blockingInstructionId: exInstruction.id,
      blockedInstructionId: idInstruction.id,
    });
  }

  if (hasRawHazardWithoutForwarding && idInstruction) {
    hazards.push({
      cycle: nextCycle,
      type: "RAW",
      stage: "ID",
      description:
        "RAW dependency detected with forwarding disabled; inserted stall bubble.",
      blockedInstructionId: idInstruction.id,
    });
  }

  const fetchedInstruction = shouldStall
    ? null
    : (current.program[current.pc] ?? null);
  const nextPc = shouldStall
    ? current.pc
    : fetchedInstruction
      ? current.pc + 1
      : current.pc;

  const nextStages: PipelineState = shouldStall
    ? {
        WB: createStage("WB", current.stages.MEM.instructionId),
        MEM: createStage("MEM", current.stages.EX.instructionId),
        EX: createStage("EX", null, true),
        ID: createStage("ID", current.stages.ID.instructionId),
        IF: createStage("IF", current.stages.IF.instructionId),
      }
    : {
        WB: createStage("WB", current.stages.MEM.instructionId),
        MEM: createStage("MEM", current.stages.EX.instructionId),
        EX: createStage("EX", current.stages.ID.instructionId),
        ID: createStage("ID", current.stages.IF.instructionId),
        IF: createStage("IF", fetchedInstruction?.id ?? null),
      };

  const committedThisCycle =
    wbInstruction && wbInstruction.opcode !== "NOP" ? 1 : 0;
  const committedInstructions =
    current.metrics.committedInstructions + committedThisCycle;
  const cycles = current.metrics.cycles + 1;

  const snapshot = createSnapshot(
    nextCycle,
    nextPc,
    nextStages,
    nextRegisterFile,
    memoryDeltas,
    hazards,
    forwardingEvents,
  );
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
      stallCount: current.metrics.stallCount + (shouldStall ? 1 : 0),
      bubbleCount:
        current.metrics.bubbleCount +
        Object.values(nextStages).filter((stage) => stage.isBubble).length,
      forwardingCount:
        current.metrics.forwardingCount + forwardingEvents.length,
    },
  };
}
