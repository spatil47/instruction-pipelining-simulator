# Parser Guide

Source of truth for API contracts: `src/simulator/parser.ts` (TSDoc on exports).

## What This Module Owns
- Parsing assembly-like text into simulator `Instruction` values.
- Non-throwing diagnostics via `ParseError`.
- Partial-success behavior so valid lines remain usable when some lines fail.

## Public API
- `ParseError`
  - One parse issue bound to a specific input line.
- `ParseProgramResult`
  - Parsed instructions plus diagnostics in one return value.
- `parseProgram(programText)`
  - Parses multi-line text and preserves successful lines.

## Supported Forms
- R-type: `ADD`, `SUB`, `AND`, `OR`, `XOR`
- I-type immediate: `ADDI`
- Memory: `LW`, `SW`
- `NOP` (no operands)
- Trailing `# ...` comments are ignored.

## Behavioral Notes
- Register syntax is constrained to `R0..R31` at parse time.
- Unknown opcode, invalid arity, malformed memory syntax, and invalid immediates are reported as diagnostics.
- Instruction IDs advance only for successfully parsed instructions.

## Related Docs
- Engine runtime behavior: [docs/simulator/engine.md](../simulator/engine.md)
- Shared instruction types: [docs/simulator/types.md](../simulator/types.md)
- UI state callers: [docs/ui/state.md](../ui/state.md)