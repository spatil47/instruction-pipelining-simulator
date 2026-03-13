import { describe, expect, it } from "vitest";

import { tickMachine } from "./engine";
import { createInitialMachineState } from "./initialState";
import { parseProgram } from "./parser";
import type { Instruction, MachineState } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProgram(lines: string): Instruction[] {
  const { instructions, errors } = parseProgram(lines);
  if (errors.length > 0) {
    throw new Error(`Parse errors: ${errors.map((e) => e.message).join(", ")}`);
  }
  return instructions;
}

function runCycles(machine: MachineState, count: number): MachineState {
  let m = machine;
  for (let i = 0; i < count; i++) m = tickMachine(m);
  return m;
}

function stageInstrText(
  machine: MachineState,
  stage: keyof MachineState["stages"],
): string | null {
  const id = machine.stages[stage].instructionId;
  if (id === null) return null;
  return machine.program.find((i) => i.id === id)?.rawText ?? null;
}

// ---------------------------------------------------------------------------
// Parser tests
// ---------------------------------------------------------------------------

describe("parseProgram", () => {
  it("parses R-type instructions", () => {
    const { instructions, errors } = parseProgram(
      "ADD R1, R2, R3\nSUB R4, R1, R2",
    );
    expect(errors).toHaveLength(0);
    expect(instructions).toHaveLength(2);
    expect(instructions[0]).toMatchObject({
      opcode: "ADD",
      dst: "R1",
      src1: "R2",
      src2: "R3",
    });
    expect(instructions[1]).toMatchObject({
      opcode: "SUB",
      dst: "R4",
      src1: "R1",
      src2: "R2",
    });
  });

  it("parses ADDI", () => {
    const { instructions, errors } = parseProgram("ADDI R5, R0, 42");
    expect(errors).toHaveLength(0);
    expect(instructions[0]).toMatchObject({
      opcode: "ADDI",
      dst: "R5",
      src1: "R0",
      immediate: 42,
    });
  });

  it("parses LW and SW", () => {
    const { instructions, errors } = parseProgram(
      "LW R1, 8(R2)\nSW R3, -4(R0)",
    );
    expect(errors).toHaveLength(0);
    expect(instructions[0]).toMatchObject({
      opcode: "LW",
      dst: "R1",
      src1: "R2",
      immediate: 8,
    });
    expect(instructions[1]).toMatchObject({
      opcode: "SW",
      src1: "R0",
      src2: "R3",
      immediate: -4,
    });
  });

  it("parses NOP", () => {
    const { instructions, errors } = parseProgram("NOP");
    expect(errors).toHaveLength(0);
    expect(instructions[0]).toMatchObject({ opcode: "NOP" });
  });

  it("assigns sequential IDs starting at 1", () => {
    const { instructions } = parseProgram(
      "ADD R1, R2, R3\nNOP\nADDI R2, R0, 1",
    );
    expect(instructions.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it("skips blank lines and comment-only lines", () => {
    const { instructions, errors } = parseProgram(
      "# comment\n\nADD R1, R2, R3\n\n",
    );
    expect(errors).toHaveLength(0);
    expect(instructions).toHaveLength(1);
  });

  it("returns error for unknown opcode", () => {
    const { errors } = parseProgram("MUL R1, R2, R3");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/unknown opcode/i);
  });

  it("returns error for wrong number of R-type operands", () => {
    const { errors } = parseProgram("ADD R1, R2");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/3 operands/i);
  });

  it("returns error for invalid register name", () => {
    const { errors } = parseProgram("ADD R1, R2, R33");
    expect(errors).toHaveLength(1);
  });

  it("returns error for NOP with operands", () => {
    const { errors } = parseProgram("NOP R1");
    expect(errors).toHaveLength(1);
  });

  it("returns error for ADDI with non-integer immediate", () => {
    const { errors } = parseProgram("ADDI R1, R2, abc");
    expect(errors).toHaveLength(1);
  });

  it("returns error for LW with missing memory operand", () => {
    const { errors } = parseProgram("LW R1, R2");
    expect(errors).toHaveLength(1);
  });

  it("tolerates mixed case opcodes and registers", () => {
    const { instructions, errors } = parseProgram("add r1, r2, r3");
    expect(errors).toHaveLength(0);
    expect(instructions[0]).toMatchObject({
      opcode: "ADD",
      dst: "R1",
      src1: "R2",
      src2: "R3",
    });
  });
});

// ---------------------------------------------------------------------------
// Stage advancement / pipeline flow tests
// ---------------------------------------------------------------------------

describe("pipeline stage advancement", () => {
  it("fetches first instruction into IF on cycle 1", () => {
    const m = runCycles(
      createInitialMachineState(makeProgram("ADD R1, R2, R3")),
      1,
    );
    expect(m.stages.IF.instructionId).toBe(1);
    expect(m.stages.ID.instructionId).toBeNull();
  });

  it("advances instruction through all 5 stages", () => {
    const prog = makeProgram("ADD R1, R2, R3");
    const m1 = createInitialMachineState(prog);
    // C1: IF=1
    const m2 = runCycles(m1, 1);
    expect(m2.stages.IF.instructionId).toBe(1);
    // C2: ID=1
    const m3 = runCycles(m2, 1);
    expect(m3.stages.ID.instructionId).toBe(1);
    // C3: EX=1
    const m4 = runCycles(m3, 1);
    expect(m4.stages.EX.instructionId).toBe(1);
    // C4: MEM=1
    const m5 = runCycles(m4, 1);
    expect(m5.stages.MEM.instructionId).toBe(1);
    // C5: WB=1
    const m6 = runCycles(m5, 1);
    expect(m6.stages.WB.instructionId).toBe(1);
  });

  it("commits instruction after WB stage", () => {
    const prog = makeProgram("ADDI R1, R0, 7");
    let m = createInitialMachineState(prog);
    m = runCycles(m, 6); // past WB completion
    expect(m.metrics.committedInstructions).toBeGreaterThanOrEqual(1);
  });

  it("PC increments for each fetched instruction", () => {
    const prog = makeProgram("ADD R1, R2, R3\nADD R4, R5, R6\nADD R7, R8, R9");
    let m = createInitialMachineState(prog);
    expect(m.pc).toBe(0);
    m = runCycles(m, 1);
    m = tickMachine(m); // C1→C2: IF fetches instr 1
    expect(m.pc).toBeGreaterThanOrEqual(1);
  });

  it("stops fetching when program exhausted", () => {
    const prog = makeProgram("ADD R1, R2, R3");
    const m = runCycles(createInitialMachineState(prog), 10);
    // After program completes, IF should be empty, no lingering instructions
    expect(m.stages.IF.instructionId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Arithmetic / execution tests
// ---------------------------------------------------------------------------

describe("instruction execution", () => {
  function runAndGetRegister(
    programText: string,
    reg: string,
    cycles = 10,
  ): number {
    const prog = makeProgram(programText);
    const m = runCycles(createInitialMachineState(prog), cycles);
    return (m.registerFile as Record<string, number>)[reg] ?? 0;
  }

  it("ADD: R1 = R2 + R3", () => {
    const prog = makeProgram("ADDI R2, R0, 5\nADDI R3, R0, 3\nADD R1, R2, R3");
    // With forwarding on: no stalls needed (ADDI results forwarded)
    const m = runCycles(createInitialMachineState(prog), 14);
    expect(m.registerFile["R1"]).toBe(8);
  });

  it("SUB: R1 = R2 - R3", () => {
    const prog = makeProgram("ADDI R2, R0, 10\nADDI R3, R0, 4\nSUB R1, R2, R3");
    const m = runCycles(createInitialMachineState(prog), 14);
    expect(m.registerFile["R1"]).toBe(6);
  });

  it("AND: R1 = R2 & R3", () => {
    const prog = makeProgram("ADDI R2, R0, 6\nADDI R3, R0, 5\nAND R1, R2, R3");
    const m = runCycles(createInitialMachineState(prog), 14);
    expect(m.registerFile["R1"]).toBe(4); // 0b110 & 0b101 = 0b100
  });

  it("OR: R1 = R2 | R3", () => {
    const prog = makeProgram("ADDI R2, R0, 6\nADDI R3, R0, 5\nOR R1, R2, R3");
    const m = runCycles(createInitialMachineState(prog), 14);
    expect(m.registerFile["R1"]).toBe(7); // 0b110 | 0b101 = 0b111
  });

  it("XOR: R1 = R2 ^ R3", () => {
    const prog = makeProgram("ADDI R2, R0, 6\nADDI R3, R0, 5\nXOR R1, R2, R3");
    const m = runCycles(createInitialMachineState(prog), 14);
    expect(m.registerFile["R1"]).toBe(3); // 0b110 ^ 0b101 = 0b011
  });

  it("ADDI: R1 = R0 + immediate", () => {
    expect(runAndGetRegister("ADDI R1, R0, 99", "R1")).toBe(99);
  });

  it("ADDI: negative immediate", () => {
    expect(runAndGetRegister("ADDI R1, R0, -7", "R1")).toBe(-7);
  });

  it("NOP does not modify registers", () => {
    const prog = makeProgram("ADDI R1, R0, 5\nNOP\nNOP");
    const m = runCycles(createInitialMachineState(prog), 14);
    expect(m.registerFile["R1"]).toBe(5);
  });

  it("R0 writes are ignored (R0 is always 0)", () => {
    expect(runAndGetRegister("ADDI R0, R0, 42", "R0")).toBe(0);
  });

  it("LW loads value from memory", () => {
    const prog = makeProgram("LW R1, 0(R0)");
    const initial = createInitialMachineState(prog);
    initial.memory[0] = 77;
    const m = runCycles(initial, 10);
    expect(m.registerFile["R1"]).toBe(77);
  });

  it("SW stores value to memory", () => {
    const prog = makeProgram("ADDI R1, R0, 55\nSW R1, 0(R0)");
    const m = runCycles(createInitialMachineState(prog), 14);
    expect(m.memory[0]).toBe(55);
  });
});

// ---------------------------------------------------------------------------
// Hazard detection tests
// ---------------------------------------------------------------------------

describe("RAW hazard detection (forwarding disabled)", () => {
  function makeNoForwardState(programText: string): MachineState {
    const prog = makeProgram(programText);
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: false,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    return m;
  }

  it("inserts bubble on EX→ID RAW hazard when forwarding is off", () => {
    // ADD R1 produces in EX; then ADD R2,R1 reads R1 in ID — stall expected
    const m = makeNoForwardState("ADDI R1, R0, 1\nADD R2, R1, R0");
    let state = m;
    let foundBubble = false;
    for (let c = 0; c < 15; c++) {
      state = tickMachine(state);
      if (state.stages.EX.isBubble) {
        foundBubble = true;
        break;
      }
    }
    expect(foundBubble).toBe(true);
  });

  it("records RAW hazard event in snapshot", () => {
    const m = makeNoForwardState("ADDI R1, R0, 1\nADD R2, R1, R0");
    let state = m;
    let hazardFound = false;
    for (let c = 0; c < 15; c++) {
      state = tickMachine(state);
      if (state.history.some((s) => s.hazards.some((h) => h.type === "RAW"))) {
        hazardFound = true;
        break;
      }
    }
    expect(hazardFound).toBe(true);
  });

  it("stallCount increments for each stall cycle", () => {
    const m = makeNoForwardState("ADDI R1, R0, 5\nADD R2, R1, R0");
    const result = runCycles(m, 15);
    expect(result.metrics.stallCount).toBeGreaterThanOrEqual(1);
  });

  it("produces correct result despite RAW stalls", () => {
    // R1=5, R2=R1+0=5
    const m = makeNoForwardState("ADDI R1, R0, 5\nADD R2, R1, R0");
    const result = runCycles(m, 20);
    expect(result.registerFile["R2"]).toBe(5);
  });
});

describe("load-use hazard", () => {
  it("inserts exactly one bubble on LW followed immediately by dependent instruction", () => {
    // LW R1; ADD R2,R1,R0 — 1 load-use stall
    const prog = makeProgram("LW R1, 0(R0)\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: true,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    const result = runCycles(m, 15);
    expect(result.metrics.stallCount).toBe(1);
  });

  it("records LOAD_USE hazard type in snapshot", () => {
    const prog = makeProgram("LW R1, 0(R0)\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    const result = runCycles(m, 15);
    const hasLoadUse = result.history.some((s) =>
      s.hazards.some((h) => h.type === "LOAD_USE"),
    );
    expect(hasLoadUse).toBe(true);
  });

  it("no load-use stall when intervening independent instruction", () => {
    // LW R1; ADDI R2,R0,1 (independent); ADD R3,R1,R2 — no load-use
    const prog = makeProgram("LW R1, 0(R0)\nADDI R2, R0, 1\nADD R3, R1, R2");
    const m = createInitialMachineState(prog);
    const result = runCycles(m, 15);
    expect(result.metrics.stallCount).toBe(0);
  });

  it("no stall when detectLoadUseHazards is disabled", () => {
    const prog = makeProgram("LW R1, 0(R0)\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: true,
      detectRawHazards: true,
      detectLoadUseHazards: false,
    };
    const result = runCycles(m, 15);
    expect(result.metrics.stallCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Forwarding tests
// ---------------------------------------------------------------------------

describe("forwarding paths", () => {
  it("MEM→EX forwarding eliminates a RAW stall", () => {
    // ADD R1; ADD R2,R1 — with forwarding no stall needed
    const progFwd = makeProgram("ADDI R1, R0, 5\nADD R2, R1, R0");
    const mFwd = createInitialMachineState(progFwd);
    mFwd.config = {
      enableForwarding: true,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };

    const progNoFwd = makeProgram("ADDI R1, R0, 5\nADD R2, R1, R0");
    const mNoFwd = createInitialMachineState(progNoFwd);
    mNoFwd.config = {
      enableForwarding: false,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };

    const fwdResult = runCycles(mFwd, 15);
    const noFwdResult = runCycles(mNoFwd, 15);

    // Forwarding should result in fewer or equal stalls
    expect(fwdResult.metrics.stallCount).toBeLessThan(
      noFwdResult.metrics.stallCount,
    );
  });

  it("forwarding produces correct result", () => {
    // ADDI R1=3, ADDI R2=4, ADD R3=R1+R2=7 — all through forwarding
    const prog = makeProgram("ADDI R1, R0, 3\nADDI R2, R0, 4\nADD R3, R1, R2");
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: true,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    const result = runCycles(m, 20);
    expect(result.registerFile["R3"]).toBe(7);
  });

  it("records ForwardingEvent in snapshot when forwarding fires", () => {
    // ADDI R1=1, then ADD R2,R1 — MEM→EX forward fires
    const prog = makeProgram("ADDI R1, R0, 1\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: true,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    const result = runCycles(m, 15);
    const hasForward = result.history.some((s) => s.forwarding.length > 0);
    expect(hasForward).toBe(true);
  });

  it("forwarding count metric equals total forwarding events", () => {
    const prog = makeProgram("ADDI R1, R0, 1\nADD R2, R1, R0\nADD R3, R2, R0");
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: true,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    const result = runCycles(m, 20);
    const totalFwdEvents = result.history.reduce(
      (sum, s) => sum + s.forwarding.length,
      0,
    );
    expect(result.metrics.forwardingCount).toBe(totalFwdEvents);
  });

  it("no forwarding events recorded when forwarding disabled", () => {
    const prog = makeProgram("ADDI R1, R0, 1\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: false,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    const result = runCycles(m, 15);
    expect(result.metrics.forwardingCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Snapshot / history / metrics tests
// ---------------------------------------------------------------------------

describe("cycle snapshots and metrics", () => {
  it("history length equals cycle count", () => {
    const m = runCycles(
      createInitialMachineState(makeProgram("ADD R1, R2, R3")),
      7,
    );
    expect(m.history).toHaveLength(m.cycle);
    expect(m.history).toHaveLength(7);
  });

  it("snapshot cycle numbers are sequential starting at 1", () => {
    const m = runCycles(createInitialMachineState(makeProgram("NOP\nNOP")), 5);
    m.history.forEach((snap, i) => {
      expect(snap.cycle).toBe(i + 1);
    });
  });

  it("snapshots are immutable (mutating live state does not affect history)", () => {
    const prog = makeProgram("ADDI R1, R0, 42");
    let m = createInitialMachineState(prog);
    m = tickMachine(m); // C1
    const savedStages = { ...m.history[0].stages };
    // Advance further — history[0] should not change
    m = runCycles(m, 5);
    expect(m.history[0].stages.IF.instructionId).toBe(
      savedStages.IF.instructionId,
    );
  });

  it("CPI is cycles / committed when there are commits", () => {
    const prog = makeProgram("ADDI R1, R0, 1\nADDI R2, R0, 2");
    const m = runCycles(createInitialMachineState(prog), 15);
    if (m.metrics.committedInstructions > 0) {
      expect(m.metrics.cpi).toBeCloseTo(
        m.metrics.cycles / m.metrics.committedInstructions,
        5,
      );
    }
  });

  it("CPI is 0 before any instruction commits", () => {
    const m = runCycles(
      createInitialMachineState(makeProgram("ADD R1, R2, R3")),
      1,
    );
    expect(m.metrics.cpi).toBe(0);
  });

  it("bubbleCount counts only bubble slots", () => {
    const prog = makeProgram("LW R1, 0(R0)\nADD R2, R1, R0");
    const m = runCycles(createInitialMachineState(prog), 15);
    const actualBubbles = m.history.reduce(
      (sum, snap) =>
        sum + Object.values(snap.stages).filter((s) => s.isBubble).length,
      0,
    );
    expect(m.metrics.bubbleCount).toBe(actualBubbles);
  });

  it("memoryDeltas are recorded in snapshot when SW executes", () => {
    const prog = makeProgram("ADDI R1, R0, 99\nSW R1, 0(R0)");
    const m = runCycles(createInitialMachineState(prog), 15);
    const deltaSnap = m.history.find((s) => s.memoryDeltas.length > 0);
    expect(deltaSnap).toBeDefined();
    expect(deltaSnap!.memoryDeltas[0]).toMatchObject({ address: 0, after: 99 });
  });
});

// ---------------------------------------------------------------------------
// Golden cycle-by-cycle scenarios
// ---------------------------------------------------------------------------

describe("golden scenario: single ADD (no hazards)", () => {
  // Single ADD R1, R0, R0 — travels all 5 stages, takes exactly 5 cycles to reach WB
  it("reaches WB at cycle 5", () => {
    const prog = makeProgram("ADD R1, R0, R0");
    let m = createInitialMachineState(prog);
    // C1: IF=1
    m = tickMachine(m);
    expect(m.stages.IF.instructionId).toBe(1);
    // C2: ID=1
    m = tickMachine(m);
    expect(m.stages.ID.instructionId).toBe(1);
    // C3: EX=1
    m = tickMachine(m);
    expect(m.stages.EX.instructionId).toBe(1);
    // C4: MEM=1
    m = tickMachine(m);
    expect(m.stages.MEM.instructionId).toBe(1);
    // C5: WB=1
    m = tickMachine(m);
    expect(m.stages.WB.instructionId).toBe(1);
    expect(m.metrics.committedInstructions).toBe(0); // WB commits at next cycle's start
    // C6: WB drains; committed
    m = tickMachine(m);
    expect(m.metrics.committedInstructions).toBe(1);
  });
});

describe("golden scenario: load-use stall", () => {
  // LW R1, 0(R0) followed immediately by ADD R2, R1, R0
  // With forwarding ON: still needs 1 stall (load-use is unavoidable)
  // Expect stallCount=1, correct R2 after completion
  it("with forwarding on: 1 stall, correct result", () => {
    const prog = makeProgram("LW R1, 0(R0)\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    m.memory[0] = 13;
    const result = runCycles(m, 15);
    expect(result.metrics.stallCount).toBe(1);
    expect(result.registerFile["R2"]).toBe(13);
  });

  it("with forwarding off: at least 1 stall, correct result", () => {
    const prog = makeProgram("LW R1, 0(R0)\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    m.memory[0] = 13;
    m.config = {
      enableForwarding: false,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    const result = runCycles(m, 20);
    expect(result.metrics.stallCount).toBeGreaterThanOrEqual(1);
    expect(result.registerFile["R2"]).toBe(13);
  });
});

describe("golden scenario: forwarding benefit", () => {
  // ADDI R1=5, ADD R2=R1+R0 — with forwarding: 0 stalls. Without: 1+ stalls.
  it("forwarding on: no stalls for back-to-back ALU dependency", () => {
    const prog = makeProgram("ADDI R1, R0, 5\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: true,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    const result = runCycles(m, 15);
    expect(result.metrics.stallCount).toBe(0);
    expect(result.registerFile["R2"]).toBe(5);
  });

  it("forwarding off: stalls for back-to-back ALU dependency", () => {
    const prog = makeProgram("ADDI R1, R0, 5\nADD R2, R1, R0");
    const m = createInitialMachineState(prog);
    m.config = {
      enableForwarding: false,
      detectRawHazards: true,
      detectLoadUseHazards: true,
    };
    const result = runCycles(m, 20);
    expect(result.metrics.stallCount).toBeGreaterThanOrEqual(1);
    expect(result.registerFile["R2"]).toBe(5);
  });
});

describe("golden scenario: deterministic replay", () => {
  it("re-running from initial state produces identical history to step-by-step", () => {
    const prog = makeProgram("ADDI R1, R0, 3\nLW R2, 0(R0)\nADD R3, R1, R2");
    const makeBase = () => {
      const m = createInitialMachineState(prog);
      m.memory[0] = 7;
      return m;
    };

    // Run 10 cycles in one shot
    const batch = runCycles(makeBase(), 10);

    // Step one at a time
    let stepped = makeBase();
    for (let i = 0; i < 10; i++) stepped = tickMachine(stepped);

    // Histories should match in length and per-cycle stage occupancy
    expect(batch.history).toHaveLength(stepped.history.length);
    for (let i = 0; i < batch.history.length; i++) {
      const a = batch.history[i];
      const b = stepped.history[i];
      expect(a.cycle).toBe(b.cycle);
      for (const stage of ["IF", "ID", "EX", "MEM", "WB"] as const) {
        expect(a.stages[stage].instructionId).toBe(
          b.stages[stage].instructionId,
        );
        expect(a.stages[stage].isBubble).toBe(b.stages[stage].isBubble);
      }
    }
  });

  it("same final register file regardless of run method", () => {
    const prog = makeProgram("ADDI R1, R0, 10\nADDI R2, R0, 3\nSUB R3, R1, R2");
    const makeBase = () => createInitialMachineState(prog);
    const batch = runCycles(makeBase(), 15);
    let stepped = makeBase();
    for (let i = 0; i < 15; i++) stepped = tickMachine(stepped);
    expect(batch.registerFile["R3"]).toBe(stepped.registerFile["R3"]);
  });
});
