import type { Instruction, Opcode, RegisterName } from "./types";

export interface ParseError {
  line: number;
  message: string;
  source: string;
}

export interface ParseProgramResult {
  instructions: Instruction[];
  errors: ParseError[];
}

const OPCODE_SET = new Set<Opcode>([
  "ADD",
  "SUB",
  "AND",
  "OR",
  "XOR",
  "ADDI",
  "LW",
  "SW",
  "NOP",
]);

const REGISTER_PATTERN = /^R([0-9]|[12][0-9]|3[01])$/;
const MEMORY_PATTERN = /^(-?\d+)\((R(?:[0-9]|[12][0-9]|3[01]))\)$/;

function parseRegister(token: string): RegisterName | null {
  const normalized = token.trim().toUpperCase();
  return REGISTER_PATTERN.test(normalized) ? (normalized as RegisterName) : null;
}

function parseOpcode(token: string): Opcode | null {
  const normalized = token.trim().toUpperCase();
  return OPCODE_SET.has(normalized as Opcode) ? (normalized as Opcode) : null;
}

function parseImmediate(token: string): number | null {
  if (!/^-?\d+$/.test(token.trim())) {
    return null;
  }

  return Number.parseInt(token.trim(), 10);
}

function splitInstruction(rawLine: string): { opcodeToken: string; argTokens: string[] } {
  const withoutComment = rawLine.split("#")[0].trim();

  if (!withoutComment) {
    return { opcodeToken: "", argTokens: [] };
  }

  const [opcodeToken, ...argParts] = withoutComment.split(/\s+/);
  const joinedArgs = argParts.join(" ");
  const argTokens = joinedArgs
    ? joinedArgs
        .split(",")
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
    : [];

  return { opcodeToken, argTokens };
}

function parseRType(
  id: number,
  opcode: Extract<Opcode, "ADD" | "SUB" | "AND" | "OR" | "XOR">,
  rawText: string,
  lineNumber: number,
  argTokens: string[],
): Instruction | ParseError {
  if (argTokens.length !== 3) {
    return {
      line: lineNumber,
      message: `${opcode} expects 3 operands: dst, src1, src2`,
      source: rawText,
    };
  }

  const dst = parseRegister(argTokens[0]);
  const src1 = parseRegister(argTokens[1]);
  const src2 = parseRegister(argTokens[2]);

  if (!dst || !src1 || !src2) {
    return {
      line: lineNumber,
      message: `${opcode} uses invalid register operands`,
      source: rawText,
    };
  }

  return { id, opcode, dst, src1, src2, rawText };
}

function parseAddi(
  id: number,
  rawText: string,
  lineNumber: number,
  argTokens: string[],
): Instruction | ParseError {
  if (argTokens.length !== 3) {
    return {
      line: lineNumber,
      message: "ADDI expects 3 operands: dst, src1, immediate",
      source: rawText,
    };
  }

  const dst = parseRegister(argTokens[0]);
  const src1 = parseRegister(argTokens[1]);
  const immediate = parseImmediate(argTokens[2]);

  if (!dst || !src1 || immediate === null) {
    return {
      line: lineNumber,
      message: "ADDI uses invalid operands",
      source: rawText,
    };
  }

  return { id, opcode: "ADDI", dst, src1, immediate, rawText };
}

function parseLoadStore(
  id: number,
  opcode: Extract<Opcode, "LW" | "SW">,
  rawText: string,
  lineNumber: number,
  argTokens: string[],
): Instruction | ParseError {
  if (argTokens.length !== 2) {
    return {
      line: lineNumber,
      message: `${opcode} expects 2 operands`,
      source: rawText,
    };
  }

  const register = parseRegister(argTokens[0]);
  const memoryMatch = argTokens[1].trim().toUpperCase().match(MEMORY_PATTERN);

  if (!register || !memoryMatch) {
    return {
      line: lineNumber,
      message: `${opcode} expects register and offset(base)`,
      source: rawText,
    };
  }

  const immediate = Number.parseInt(memoryMatch[1], 10);
  const base = parseRegister(memoryMatch[2]);

  if (!base) {
    return {
      line: lineNumber,
      message: `${opcode} base register is invalid`,
      source: rawText,
    };
  }

  return opcode === "LW"
    ? { id, opcode, dst: register, src1: base, immediate, rawText }
    : { id, opcode, src1: base, src2: register, immediate, rawText };
}

export function parseProgram(programText: string): ParseProgramResult {
  const instructions: Instruction[] = [];
  const errors: ParseError[] = [];
  const lines = programText.split(/\r?\n/);
  let nextId = 1;

  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const { opcodeToken, argTokens } = splitInstruction(line);

    if (!opcodeToken) {
      return;
    }

    const opcode = parseOpcode(opcodeToken);
    if (!opcode) {
      errors.push({
        line: lineNumber,
        message: `Unknown opcode '${opcodeToken}'`,
        source: line,
      });
      return;
    }

    if (opcode === "NOP") {
      if (argTokens.length !== 0) {
        errors.push({
          line: lineNumber,
          message: "NOP does not take operands",
          source: line,
        });
        return;
      }

      instructions.push({ id: nextId, opcode, rawText: line.trim() });
      nextId += 1;
      return;
    }

    let parsed: Instruction | ParseError;

    if (["ADD", "SUB", "AND", "OR", "XOR"].includes(opcode)) {
      parsed = parseRType(
        nextId,
        opcode as Extract<Opcode, "ADD" | "SUB" | "AND" | "OR" | "XOR">,
        line.trim(),
        lineNumber,
        argTokens,
      );
    } else if (opcode === "ADDI") {
      parsed = parseAddi(nextId, line.trim(), lineNumber, argTokens);
    } else {
      parsed = parseLoadStore(
        nextId,
        opcode as Extract<Opcode, "LW" | "SW">,
        line.trim(),
        lineNumber,
        argTokens,
      );
    }

    if ("message" in parsed) {
      errors.push(parsed);
      return;
    }

    instructions.push(parsed);
    nextId += 1;
  });

  return { instructions, errors };
}
