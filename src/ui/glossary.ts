export interface GlossaryEntry {
  term: string;
  category: string;
  preview: string;
  definition: string;
  syntax?: string;
  example?: string;
  diagram?: string;
  relatedTerms?: string[];
}

const glossary: Record<string, GlossaryEntry> = {
  // ── Pipeline stages ──────────────────────────────────────────────────────
  IF: {
    term: "IF — Instruction Fetch",
    category: "Pipeline Stage",
    preview:
      "Reads the next instruction from memory using the Program Counter (PC) and increments PC to point to the following instruction.",
    definition:
      "The Instruction Fetch stage is the first stage of the 5-stage MIPS-style pipeline. It reads the instruction pointed to by the Program Counter from the instruction memory, latches it into the IF/ID pipeline register, and increments the PC by 4 (one word). If a branch or jump target is resolved here, the PC is updated accordingly. A stall in this stage freezes the PC and the IF/ID register.",
    diagram: `PC ──► [ Instruction Memory ] ──► IF/ID register
              ▲
              └─── PC + 4 (next instruction)`,
    relatedTerms: ["ID", "EX", "MEM", "WB", "PC", "stall", "bubble"],
  },

  ID: {
    term: "ID — Instruction Decode",
    category: "Pipeline Stage",
    preview:
      "Decodes the fetched instruction, reads source registers from the register file, and prepares control signals for downstream stages.",
    definition:
      "The Instruction Decode stage decodes the opcode and function fields to generate control signals for the EX, MEM, and WB stages. It simultaneously reads both source operands (rs, rt) from the register file. Hazard detection logic in this stage checks for RAW and load-use hazards. If a load-use hazard is detected, a bubble is injected and the pipeline is stalled for one cycle.",
    diagram: `IF/ID ──► [ Decoder ]  ──► ID/EX register
                     ──► [ RegFile ] ──► rs_val, rt_val`,
    relatedTerms: ["IF", "EX", "RAW", "LOAD_USE", "RegisterFile", "stall", "bubble"],
  },

  EX: {
    term: "EX — Execute",
    category: "Pipeline Stage",
    preview:
      "Performs the ALU operation (arithmetic, logic, or address computation) and optionally receives forwarded values from later stages.",
    definition:
      "The Execute stage is where the ALU computes results. For R-type instructions (ADD, SUB, AND, OR, XOR) the ALU performs the specified operation on rs and rt. For I-type instructions (ADDI) it adds rs to the sign-extended immediate. For memory instructions (LW, SW) it computes the effective address (base + offset). Forwarding logic in this stage can substitute stale register reads with results from the MEM or WB stage, eliminating stall cycles.",
    diagram: `ID/EX ──► [ ALU ] ──► EX/MEM register
  Forwarding:  MEM/WB.result ──► ALU input A or B
               EX/MEM.result ──► ALU input A or B`,
    relatedTerms: ["ID", "MEM", "WB", "forwarding", "MEM_EX_Forward", "RAW"],
  },

  MEM: {
    term: "MEM — Memory Access",
    category: "Pipeline Stage",
    preview:
      "Accesses data memory for load (LW) and store (SW) instructions; otherwise passes the ALU result through unchanged.",
    definition:
      "The Memory Access stage interfaces with data memory. For LW instructions the stage reads a 32-bit word from the address produced by EX and places the result in the MEM/WB register. For SW instructions it writes the value of rt to that address. All other instructions simply propagate their ALU result through this stage without touching memory. The MEM→EX forwarding path originates here: the result about to be written back is available one cycle earlier.",
    relatedTerms: ["EX", "WB", "LW", "SW", "MEM_EX_Forward", "forwarding"],
  },

  WB: {
    term: "WB — Write-Back",
    category: "Pipeline Stage",
    preview:
      "Writes the instruction's result (ALU or loaded value) back into the destination register of the register file.",
    definition:
      "The Write-Back stage is the final stage of the pipeline. It selects either the ALU result or the data read from memory (for LW) and writes it to the destination register (rd for R-type, rt for I-type) in the register file. Two instructions can be in WB simultaneously only in a superscalar processor; in a single-issue in-order pipeline like this simulator, only one WB write occurs per cycle. After WB the instruction is considered committed.",
    relatedTerms: ["MEM", "RegisterFile", "forwarding"],
  },

  // ── Opcodes ──────────────────────────────────────────────────────────────
  ADD: {
    term: "ADD — Add",
    category: "Opcode (R-type)",
    preview:
      "Adds two register values and writes the result to a destination register: rd = rs + rt.",
    definition:
      "ADD is an R-type arithmetic instruction. It reads two source registers (rs and rt), performs a 32-bit signed integer addition, and writes the sum to the destination register (rd). No memory access is performed. ADD is a typical source of RAW hazards when a subsequent instruction reads rd before ADD reaches WB.",
    syntax: "ADD rd, rs, rt",
    example: "ADD R3, R1, R2   ; R3 = R1 + R2",
    relatedTerms: ["SUB", "ADDI", "RAW", "forwarding", "R-type"],
  },

  SUB: {
    term: "SUB — Subtract",
    category: "Opcode (R-type)",
    preview:
      "Subtracts the second source register from the first and writes the result: rd = rs − rt.",
    definition:
      "SUB is an R-type arithmetic instruction. It reads rs and rt, computes rs − rt using 32-bit two's-complement subtraction, and writes the result to rd. Like ADD it does not touch memory and can cause RAW hazards for subsequent consumers of rd.",
    syntax: "SUB rd, rs, rt",
    example: "SUB R3, R1, R2   ; R3 = R1 - R2",
    relatedTerms: ["ADD", "ADDI", "RAW", "forwarding", "R-type"],
  },

  AND: {
    term: "AND — Bitwise AND",
    category: "Opcode (R-type)",
    preview:
      "Computes the bitwise AND of two registers and writes the result to rd.",
    definition:
      "AND is an R-type bitwise logical instruction. It performs a bitwise AND between all 32 bits of rs and rt and writes the result to rd. Commonly used for masking bits (clearing specific bits to 0).",
    syntax: "AND rd, rs, rt",
    example: "AND R3, R1, R2   ; R3 = R1 & R2",
    relatedTerms: ["OR", "XOR", "R-type"],
  },

  OR: {
    term: "OR — Bitwise OR",
    category: "Opcode (R-type)",
    preview:
      "Computes the bitwise OR of two registers and writes the result to rd.",
    definition:
      "OR is an R-type bitwise logical instruction. It performs a bitwise inclusive OR between rs and rt and writes the result to rd. Commonly used for setting specific bits to 1.",
    syntax: "OR rd, rs, rt",
    example: "OR R3, R1, R2    ; R3 = R1 | R2",
    relatedTerms: ["AND", "XOR", "R-type"],
  },

  XOR: {
    term: "XOR — Bitwise XOR",
    category: "Opcode (R-type)",
    preview:
      "Computes the bitwise exclusive OR of two registers and writes the result to rd.",
    definition:
      "XOR is an R-type bitwise logical instruction. It performs a bitwise exclusive OR (XOR) between rs and rt and writes the result to rd. Commonly used to toggle bits, compute bit differences, or implement simple swap patterns.",
    syntax: "XOR rd, rs, rt",
    example: "XOR R3, R1, R2   ; R3 = R1 ^ R2",
    relatedTerms: ["AND", "OR", "R-type"],
  },

  ADDI: {
    term: "ADDI — Add Immediate",
    category: "Opcode (I-type)",
    preview:
      "Adds a register and a sign-extended 16-bit immediate constant: rt = rs + imm.",
    definition:
      "ADDI is an I-type arithmetic instruction. It sign-extends the 16-bit immediate field to 32 bits and adds it to rs, writing the result to rt. Because the second operand is embedded in the instruction encoding, no second register read is needed, but ADDI still reads rs and can be a consumer in a RAW hazard.",
    syntax: "ADDI rt, rs, imm",
    example: "ADDI R2, R1, 5   ; R2 = R1 + 5",
    relatedTerms: ["ADD", "LW", "I-type", "immediate", "RAW"],
  },

  LW: {
    term: "LW — Load Word",
    category: "Opcode (I-type / Memory)",
    preview:
      "Loads a 32-bit word from memory at address (rs + offset) into register rt.",
    definition:
      "LW is an I-type memory-load instruction. In EX it computes the effective address by adding the base register rs to the sign-extended 16-bit offset. In MEM it reads a 32-bit word from that address. In WB the loaded value is written to rt. Because the result is not available until after MEM, an instruction immediately following LW that needs rt cannot be helped by forwarding alone — a one-cycle load-use stall is always inserted when forwarding is enabled, two cycles without forwarding.",
    syntax: "LW rt, offset(rs)",
    example: "LW R1, 4(R0)     ; R1 = Memory[R0 + 4]",
    diagram: `EX:  addr = R0 + 4
MEM: R1 = Memory[addr]   ← data read here
WB:  RegFile[R1] = R1    ← earliest write-back`,
    relatedTerms: ["SW", "LOAD_USE", "stall", "forwarding", "I-type", "MemoryFormat"],
  },

  SW: {
    term: "SW — Store Word",
    category: "Opcode (I-type / Memory)",
    preview:
      "Stores a 32-bit register value to memory at address (rs + offset).",
    definition:
      "SW is an I-type memory-store instruction. It reads two registers: rs for the base address and rt for the data to store. In EX it computes rs + offset. In MEM it writes 32 bits of rt to that address. SW has no WB step (no register write-back). Note that SW reads rt, so if a preceding instruction is writing rt and forwarding is disabled, a RAW stall may occur.",
    syntax: "SW rt, offset(rs)",
    example: "SW R1, 4(R0)     ; Memory[R0 + 4] = R1",
    relatedTerms: ["LW", "RAW", "forwarding", "I-type", "MemoryFormat"],
  },

  NOP: {
    term: "NOP — No Operation",
    category: "Opcode",
    preview:
      "Does nothing; occupies one pipeline slot for one cycle without reading or writing any registers.",
    definition:
      "NOP is a pseudo-instruction that performs no operation. It advances through all five pipeline stages without reading or producing any register values and without performing a memory access. NOPs are typically inserted by the assembler or programmer to fill delay slots or to manually separate instructions that would otherwise cause hazards.",
    syntax: "NOP",
    example: "NOP              ; no effect",
    relatedTerms: ["bubble", "stall"],
  },

  // ── Hazards ───────────────────────────────────────────────────────────────
  RAW: {
    term: "RAW — Read After Write Hazard",
    category: "Hazard",
    preview:
      "A data hazard where an instruction tries to read a register before an earlier instruction has finished writing it.",
    definition:
      "A Read-After-Write (RAW) hazard — also called a true dependency or flow dependency — occurs when instruction B reads a register that instruction A (earlier in program order) has not yet written back. In a 5-stage pipeline without forwarding, the result of an arithmetic instruction does not reach WB until 3 cycles after EX, so the following 2 instructions would read stale values. Forwarding eliminates most RAW hazards by routing results directly from EX/MEM or MEM/WB pipeline registers back to the EX stage. Load-use hazards are a special case of RAW that forwarding alone cannot resolve.",
    diagram: `  ADD R1, R2, R3    IF  ID  EX  MEM  WB
  SUB R4, R1, R5        IF  ID  EX  MEM  WB
                                ▲
                          R1 not yet written — RAW stall without forwarding`,
    relatedTerms: ["LOAD_USE", "forwarding", "stall", "bubble"],
  },

  LOAD_USE: {
    term: "Load-Use Hazard",
    category: "Hazard",
    preview:
      "A special RAW hazard where a load (LW) is immediately followed by an instruction that uses the loaded value — one stall cycle is unavoidable even with forwarding.",
    definition:
      "A load-use hazard arises when the instruction immediately after a LW reads the register that LW is loading. Because LW's result is only available after the MEM stage, and the next instruction needs it at the start of EX (one cycle earlier), forwarding cannot bridge this gap without a 1-cycle penalty. The pipeline inserts one bubble (stall) between the LW and its consumer, then forwards the loaded value from the MEM/WB register to the EX stage once it becomes available.",
    diagram: `  LW  R1, 0(R0)    IF  ID  EX  MEM  WB
  ADD R2, R1, R3       IF  ID  **  EX   MEM  WB
                               ↑ stall (bubble inserted)`,
    relatedTerms: ["RAW", "LW", "stall", "bubble", "forwarding"],
  },

  // ── Forwarding ────────────────────────────────────────────────────────────
  forwarding: {
    term: "Forwarding (Data Forwarding / Bypassing)",
    category: "Concept",
    preview:
      "A hardware technique that routes a computed result directly from a later pipeline stage back to an earlier stage, avoiding stall cycles.",
    definition:
      "Forwarding (also called bypassing or short-circuiting) allows the result of an instruction in EX/MEM or MEM/WB to be delivered directly to the ALU inputs of an instruction in EX, rather than waiting for the result to travel all the way to WB and then be read by the next instruction's ID stage. With full forwarding enabled, RAW hazards for arithmetic instructions are resolved with zero stall cycles. Load-use hazards still require one stall because LW's data is not ready until after MEM.",
    diagram: `  ADD R1, R2, R3   IF  ID  [EX]──┐  MEM  WB
  SUB R4, R1, R5       IF  ID  [EX]  MEM  WB
                                ▲
                     forwarded R1 value`,
    relatedTerms: ["MEM_EX_Forward", "RAW", "LOAD_USE", "EX", "MEM"],
  },

  MEM_EX_Forward: {
    term: "MEM→EX Forwarding Path",
    category: "Concept",
    preview:
      "Forwards a result from the MEM stage back to an instruction currently in EX — the second forwarding path, used when the producing instruction is two cycles ahead.",
    definition:
      "The MEM→EX forwarding path (sometimes called the 'second forwarding path') takes the ALU result sitting in the MEM/WB pipeline register and routes it to the ALU input of the instruction currently in EX. This handles the case where instruction A is in MEM while instruction B (which reads A's result) is in EX — a distance of two pipeline stages. It complements the EX→EX (or EX/MEM→EX) path which handles a distance of one stage.",
    relatedTerms: ["forwarding", "EX", "MEM", "RAW"],
  },

  // ── Metrics ───────────────────────────────────────────────────────────────
  CPI: {
    term: "CPI — Cycles per Instruction",
    category: "Metric",
    preview:
      "The average number of clock cycles consumed per committed instruction; lower is better (ideal = 1.0 for a stall-free pipeline).",
    definition:
      "CPI = Total Cycles / Committed Instructions. For a perfect 5-stage in-order pipeline with no hazards, CPI approaches 1.0. Every stall cycle adds to the total cycle count without increasing the committed instruction count, raising CPI. With forwarding disabled a RAW hazard costs 2 stall cycles; with forwarding it costs 0. A load-use hazard costs 1 cycle even with forwarding. CPI is a key measure of pipeline efficiency.",
    relatedTerms: ["stall", "bubble", "forwarding", "RAW", "LOAD_USE"],
  },

  stall: {
    term: "Stall (Pipeline Stall)",
    category: "Concept",
    preview:
      "A pause inserted into the pipeline to prevent a hazard; the fetch and decode stages freeze while a bubble propagates forward.",
    definition:
      "A pipeline stall occurs when the hazard detection logic determines that an instruction cannot safely advance to the next stage. The PC and the IF/ID register are frozen (held at their current values), and a NOP (bubble) is injected into the ID/EX register so that downstream stages continue to see valid — but harmless — data. Stalls directly increase CPI because cycles pass without new instructions being committed.",
    relatedTerms: ["bubble", "RAW", "LOAD_USE", "CPI", "hazard detection"],
  },

  bubble: {
    term: "Bubble",
    category: "Concept",
    preview:
      "A NOP inserted into the pipeline to fill a stall slot; it propagates forward through all stages without reading or writing registers.",
    definition:
      "A bubble is an artificially inserted NOP that travels through the pipeline like a real instruction but performs no read, compute, or write-back operations. Bubbles are created by the stall mechanism: when a hazard is detected, a bubble is placed in the ID/EX register to prevent a valid-but-wrong instruction from executing. Bubbles show up as yellow cells in the pipeline visualization. The bubble count metric counts how many of these were injected.",
    relatedTerms: ["stall", "NOP", "CPI"],
  },

  // ── Core concepts ─────────────────────────────────────────────────────────
  Pipeline: {
    term: "Instruction Pipeline",
    category: "Concept",
    preview:
      "An implementation technique that overlaps the execution of multiple instructions by dividing the work into discrete stages.",
    definition:
      "A pipeline divides instruction execution into stages (IF, ID, EX, MEM, WB) and processes a different instruction in each stage every cycle. This overlap (analogous to an assembly line) allows a new instruction to complete every cycle once the pipeline is full, achieving a throughput of approximately 1 instruction/cycle. Hazards — data dependencies, structural conflicts, or control flow changes — are the main source of inefficiency.",
    diagram: `Cycle:  1    2    3    4    5    6    7
I1:    [IF] [ID] [EX] [MEM][WB]
I2:         [IF] [ID] [EX] [MEM][WB]
I3:              [IF] [ID] [EX] [MEM][WB]`,
    relatedTerms: ["IF", "ID", "EX", "MEM", "WB", "stall", "bubble", "forwarding"],
  },

  ILP: {
    term: "ILP — Instruction-Level Parallelism",
    category: "Concept",
    preview:
      "The degree to which instructions in a program can be executed simultaneously without violating data or control dependencies.",
    definition:
      "Instruction-Level Parallelism (ILP) measures how many independent instructions exist in a code sequence. A 5-stage pipeline extracts ILP by keeping all five stages busy with different instructions at the same time. Hazards reduce ILP by forcing stalls. Techniques like forwarding, out-of-order execution, register renaming, and branch prediction increase effective ILP.",
    relatedTerms: ["Pipeline", "RAW", "forwarding", "CPI"],
  },

  PC: {
    term: "PC — Program Counter",
    category: "Concept",
    preview:
      "A register that holds the address of the next instruction to be fetched.",
    definition:
      "The Program Counter is a special-purpose register that always points to the memory address of the next instruction to fetch. In a normal, non-branching execution it is incremented by 4 (one 32-bit word) after each fetch. During a stall the PC is frozen so the same instruction is fetched again. In a branch the PC is loaded with the branch target address.",
    relatedTerms: ["IF", "stall"],
  },

  RegisterFile: {
    term: "Register File",
    category: "Concept",
    preview:
      "The set of general-purpose registers (R0–R15 in this simulator) that instructions read from and write to.",
    definition:
      "The register file is an on-chip multi-port SRAM array that holds the 16 general-purpose integer registers R0–R15. In the ID stage two read ports supply the operand values to be latched into the pipeline register. In the WB stage one write port writes the result back. Reading and writing can happen in the same cycle (write-then-read within one cycle, sometimes called 'register file bypassing').",
    relatedTerms: ["ID", "WB", "ZeroRegister"],
  },

  ZeroRegister: {
    term: "R0 — Zero Register",
    category: "Concept",
    preview:
      "R0 is hardwired to zero; reads always return 0 and writes are silently discarded.",
    definition:
      "In MIPS-inspired architectures the register R0 (or $zero) is hardwired to the constant value 0. Any instruction that reads R0 receives 0 regardless of what was previously written to it. Any instruction that attempts to write R0 has its write silently discarded. This is useful for implementing moves (ADD rd, rs, R0) and comparisons with zero.",
    relatedTerms: ["RegisterFile", "LW"],
  },

  // ── Config flags ──────────────────────────────────────────────────────────
  enableForwarding: {
    term: "Enable Forwarding",
    category: "Config Flag",
    preview:
      "Toggles the forwarding (bypassing) hardware on or off; disabling it causes all RAW hazards to stall 2 extra cycles.",
    definition:
      "When forwarding is enabled the simulator routes EX/MEM and MEM/WB results directly back to the EX stage inputs, eliminating stall cycles for arithmetic RAW hazards. When disabled, pipeline stalls are inserted until the producing instruction completes WB and the consuming instruction can safely read the register file in ID — adding 2 stall cycles per standard RAW hazard (or 3 for a LW followed two instructions later). Load-use hazards still cost 1 stall even with forwarding enabled.",
    relatedTerms: ["forwarding", "RAW", "LOAD_USE", "stall"],
  },

  detectRawHazards: {
    term: "Detect RAW Hazards",
    category: "Config Flag",
    preview:
      "Controls whether the hazard detection unit checks for read-after-write data hazards.",
    definition:
      "When enabled the hazard detection unit in the ID stage inspects whether either source register of the instruction being decoded matches the destination register of instructions currently in EX or MEM. If a match is found and forwarding is unavailable (or insufficient), a stall is inserted. Disabling this flag turns off all RAW detection — the pipeline will produce incorrect results for programs with data dependencies, but it is useful for demonstrating what hazards look like without protection.",
    relatedTerms: ["RAW", "stall", "forwarding"],
  },

  detectLoadUseHazards: {
    term: "Detect Load-Use Hazards",
    category: "Config Flag",
    preview:
      "Controls whether the hazard detection unit inserts the mandatory 1-cycle stall after LW instructions.",
    definition:
      "A load-use hazard occurs when LW is immediately followed by an instruction that reads the just-loaded register. Even with forwarding, the loaded value is only available after the MEM stage, which is one cycle too late for the consumer in EX. When enabled, the hazard detection unit inserts one bubble after LW in this situation. If disabled, the stall is suppressed and the consumer receives a stale register value — useful for illustrating the hazard visually without the protection.",
    relatedTerms: ["LOAD_USE", "LW", "RAW", "stall", "forwarding"],
  },

  // ── Instruction formats ───────────────────────────────────────────────────
  "R-type": {
    term: "R-type Instruction Format",
    category: "Assembly Concept",
    preview:
      "Three-register instruction format where two source registers and one destination register are named explicitly.",
    definition:
      "R-type (Register-type) instructions encode three register operands: rs and rt as sources and rd as the destination. In this simulator the R-type opcodes are ADD, SUB, AND, OR, and XOR. All three register fields fit within the 32-bit instruction word along with the opcode and function code.",
    syntax: "OPCODE rd, rs, rt",
    example: "ADD R3, R1, R2",
    relatedTerms: ["ADD", "SUB", "AND", "OR", "XOR", "I-type"],
  },

  "I-type": {
    term: "I-type Instruction Format",
    category: "Assembly Concept",
    preview:
      "Two-register plus 16-bit immediate instruction format used for arithmetic-with-constant and memory access.",
    definition:
      "I-type (Immediate-type) instructions use a 16-bit immediate field embedded in the instruction word instead of a third register specifier. The two register fields are rs (source / base) and rt (destination for loads / source for stores). In this simulator the I-type opcodes are ADDI, LW, and SW.",
    syntax: "OPCODE rt, rs, imm   (arithmetic)\nOPCODE rt, offset(rs)  (memory)",
    example: "ADDI R2, R1, 10\nLW   R3, 8(R0)",
    relatedTerms: ["ADDI", "LW", "SW", "R-type", "immediate", "MemoryFormat"],
  },

  immediate: {
    term: "Immediate Value",
    category: "Assembly Concept",
    preview:
      "A constant integer value encoded directly inside the instruction word rather than stored in a register.",
    definition:
      "An immediate is a literal integer constant that is part of the instruction encoding itself. In I-type instructions the immediate occupies the lower 16 bits of the 32-bit instruction word and is sign-extended to 32 bits before being used by the ALU. For memory instructions the immediate serves as an address offset.",
    relatedTerms: ["I-type", "ADDI", "LW", "SW"],
  },

  MemoryFormat: {
    term: "Memory Address Format: offset(base)",
    category: "Assembly Concept",
    preview:
      "The addressing syntax used by LW and SW: a constant offset added to a base register gives the effective memory address.",
    definition:
      "Memory instructions use the format `offset(base)` where `base` is a register holding the base address and `offset` is a signed integer constant. The effective address is computed as base + sign_extend(offset) in the EX stage. This is the standard MIPS base+displacement addressing mode.",
    syntax: "LW rt, offset(rs)\nSW rt, offset(rs)",
    example: "LW R1, 4(R0)   ; address = R0 + 4",
    relatedTerms: ["LW", "SW", "I-type", "immediate"],
  },

  // ── UI terms ──────────────────────────────────────────────────────────────
  WaterfallDiagram: {
    term: "Pipeline Waterfall Diagram",
    category: "UI",
    preview:
      "A grid showing each instruction's progress through pipeline stages over time — rows are instructions, columns are cycles.",
    definition:
      "The waterfall (or pipeline space-time diagram) is a classic tool for visualizing pipeline execution. Each row represents one instruction from the program. Each column represents one clock cycle. The cell at (instruction, cycle) shows which pipeline stage that instruction occupied during that cycle, or is blank if the instruction had not yet entered or had already exited the pipeline. Stalls appear as cells where an instruction is repeated in the same stage, and bubbles appear as extra rows inserted between instructions.",
    relatedTerms: ["Pipeline", "stall", "bubble", "forwarding"],
  },

  TimelineScrubber: {
    term: "Timeline Scrubber",
    category: "UI",
    preview:
      "A slider that lets you rewind or fast-forward through the recorded history of pipeline cycles.",
    definition:
      "The timeline scrubber is a range input that selects which recorded cycle snapshot to display in the Pipeline Stages and overlay panels. Dragging it left replays earlier cycles; dragging it fully right (or clicking LIVE) returns to the latest cycle. The LIVE indicator turns green when you are viewing real-time output.",
    relatedTerms: ["Pipeline", "WaterfallDiagram"],
  },
};

export default glossary;
