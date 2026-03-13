# Interactive CPU Pipeline ILP Visualizer

A Vue 3 + TypeScript single-page app that simulates a classic 5-stage integer
pipeline and visualizes instruction flow, hazard stalls, and data forwarding in
real time.

---

## Getting Started

```bash
npm install
npm run dev        # development server
npm run build      # production build
npm test           # run unit tests (Vitest)
```

---

## Features

| Feature | Details |
|---------|---------|
| **5-stage pipeline** | IF → ID → EX → MEM → WB |
| **Integer instruction set** | ADD, SUB, AND, OR, XOR, ADDI, LW, SW, NOP |
| **Hazard detection** | RAW stalls and load-use stalls (toggleable) |
| **MEM→EX forwarding** | Bypass path from MEM result to EX operand (toggleable) |
| **Cycle-accurate history** | Immutable snapshot per cycle; scrub back through any past state |
| **Interactive controls** | Play / Pause / Step / Reset; speed slider (80 ms – 2 s per tick) |
| **Program editor** | Editable machine-code input with inline parse errors; Apply & Reset |
| **Metrics** | CPI, committed instructions, stall count, bubble count, forwarding count |
| **Waterfall diagram** | Classic instruction × cycle grid with color-coded cells |
| **Event log** | Per-cycle hazard and forwarding events |
| **Responsive layout** | Two-column desktop, single-column mobile |

---

## Instruction Syntax

All mnemonics and register names are case-insensitive. Comments start with `#`.

```
# R-type (register ← register op register)
ADD  Rdst, Rsrc1, Rsrc2
SUB  Rdst, Rsrc1, Rsrc2
AND  Rdst, Rsrc1, Rsrc2
OR   Rdst, Rsrc1, Rsrc2
XOR  Rdst, Rsrc1, Rsrc2

# I-type (register ← register op immediate)
ADDI Rdst, Rsrc1, imm     # imm is a signed decimal integer

# Memory (offset is a signed decimal integer; base is a register)
LW   Rdst, offset(Rbase)
SW   Rsrc, offset(Rbase)

# No-op
NOP
```

Registers are named `R0`–`R31`. `R0` is hardwired to zero (writes are silently
discarded).

---

## Simulation Model

### Pipeline stages

| Stage | Work done |
|-------|-----------|
| **IF** | Fetch instruction at PC; increment PC |
| **ID** | Decode; read register operands; detect hazards |
| **EX** | Execute ALU operation; compute effective memory address |
| **MEM** | Load from / store to memory |
| **WB** | Write result back to register file |

### Tick order (within one cycle)

1. **WB** — commit register write from previous MEM result.
2. **MEM** — perform load or store using EX result.
3. **EX** — execute ALU op, optionally consuming a MEM-forwarded value.
4. **ID** — decode operands; check for hazards.
5. **IF** — fetch next instruction unless stalling.

### Hazards

**RAW (Read-After-Write) stall** — detected when the instruction in ID reads a
register that the instruction in EX or MEM will write, and forwarding is
disabled. One bubble is inserted per cycle of dependency.

**Load-use stall** — detected when the instruction in EX is a `LW` whose
destination register is read by the instruction currently in ID. Because the
loaded value is not available until the end of MEM, forwarding cannot eliminate
this stall. Exactly one bubble is inserted even when forwarding is enabled.

### Forwarding

When forwarding is enabled the **MEM→EX path** is active: if the instruction in
MEM has a pending result (i.e. it is not a load-in-flight or a store) and the
instruction entering EX reads the same register, the result is passed directly
to EX's ALU input instead of reading the (stale) register file. This eliminates
back-to-back ALU RAW stalls without any pipeline bubbles.

### Determinism

Every `tickMachine` call is a pure function — it takes a `MachineState` and
returns a new one without mutating its input. The full cycle history is stored
as an array of immutable `CycleSnapshot` objects. Scrubbing the timeline or
replaying from any checkpoint always produces the same result.

---

## Demo Program

The default program loaded on startup demonstrates all key behaviours:

```
LW   R1, 0(R0)     # load R1 from Mem[0] — triggers load-use if followed immediately
ADDI R6, R0, 10   # independent; fills the load-use bubble slot usefully
ADD  R2, R1, R6   # RAW on R1 (LW) and R6 (ADDI); forwarding resolves R6
ADD  R3, R2, R6   # RAW on R2 (ADD above); MEM→EX forwarding resolves R2
SW   R3, 4(R0)    # store result to Mem[4]
```

Toggle **Forwarding** off to watch the extra stall bubbles appear. Toggle
**Load-use detection** off to see what goes wrong when the hazard is ignored.

---

## Project Structure

```
src/
	simulator/
		types.ts          — All shared TypeScript types
		config.ts         — Default config and pipeline/register factory helpers
		parser.ts         — Machine-code text → Instruction[] with error reporting
		engine.ts         — Pure tickMachine() simulation engine
		initialState.ts   — Default demo program and MachineState factory
		simulator.test.ts — Vitest unit and golden-scenario tests (56 tests)
	ui/
		state.ts          — VisualizerUiState and play/pause/step/reset helpers
	App.vue             — Full interactive single-page visualizer
	main.ts             — Vue app entry point
	style.css           — Global base styles
```

---

## Running Tests

```bash
npm test           # single run, exit with pass/fail code
npm run test:watch # watch mode with re-run on file changes
```

The test suite covers:
- Parser: valid instructions, error cases, whitespace/comment handling
- Stage advancement: instruction flow through all 5 stages
- Arithmetic: all opcodes, LW/SW memory round-trip, R0 hardwire
- RAW hazard detection (forwarding off)
- Load-use hazard detection
- Forwarding: stall elimination, correct results, event recording
- Metrics: CPI, stall count, bubble count, forwarding count
- Golden scenarios: single-instruction timing, load-use stall, forwarding benefit
- Deterministic replay: batch vs. step-by-step produce identical history

---

## Deploying To GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys the app to
GitHub Pages whenever you push to `main`.

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the Actions tab).

The workflow publishes the Vite build output from `dist/`. The Vite config
automatically sets the correct `base` path during GitHub Actions builds, so
assets load correctly on Pages project URLs.
