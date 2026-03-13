## Todo: Interactive CPU Pipeline ILP Visualizer

Build a Vue + TypeScript single-page app that simulates a 5-stage integer pipeline and visualizes instruction flow through CPU internals in real time.

### Core Implementation

- [x] Phase 1: Foundation
- [x] Initialize Vue + TypeScript structure with strict separation between simulation engine and UI state.
- [x] Lock v1 boundaries: 5 stages (IF/ID/EX/MEM/WB), integer ops, educational hazard model, no backend.
- [x] Define core types for instructions, pipeline stages, register file, memory, hazard events, forwarding events, and cycle snapshots.

- [x] Phase 2: Deterministic simulation engine
- [x] Implement machine-code parser/validator for editable program input.
- [x] Implement cycle tick order: WB commit, MEM access, EX execute, ID decode/hazard check, IF fetch/PC update.
- [x] Implement stage advancement, bubble insertion, and stall behavior with immutable snapshot output each cycle.
- [x] Implement hazard logic: RAW detection, load-use stalls.
- [x] Implement forwarding paths controlled by toggles.
- [x] Store full cycle history and derived metrics (CPI, stalls, forwarding count).

- [x] Phase 3: CPU internals visualization
- [x] Render per-stage instruction occupancy per cycle.
- [x] Build initial interactive CPU/pipeline snapshot view.
- [ ] Animate data movement (operand read, ALU result, memory transfer, writeback).
- [x] Overlay hazards/forwarding directly on datapath (bubble markers, bypass arrows, stall labels).
- [x] Add side views for register deltas, memory deltas, and event log.

- [x] Phase 4: Interactivity and controls
- [x] Add Play, Pause, Step, Reset controls.
- [x] Add speed slider for tick cadence.
- [x] Add editable machine-code program editor with inline parse errors and apply/load flow.
- [x] Add cycle timeline scrubber bound to history snapshots.
- [x] Add forwarding/hazard toggles and deterministic rerun when settings change.

- [x] Phase 5: Demo and UX polish
- [x] Ship default demo program showing ILP, load-use hazard, and forwarding benefit.
- [x] Add legend/onboarding for stage colors, bubbles, and bypass arrows.
- [x] Ensure responsive behavior on desktop/mobile with readable diagram and controls.

- [x] Phase 6: Verification
- [x] Unit-test parser, stage transitions, hazards, and forwarding.
- [x] Add golden cycle-by-cycle scenarios with forwarding on/off.
- [x] Verify deterministic replay: stepping and scrubbing always match stored snapshots.
- [x] Manual-check control synchronization and datapath highlight correctness.
- [ ] Validate responsive layout at multiple viewport widths.

### Commit Workflow

- [x] Commit one logical change per commit.
- [x] Keep each commit buildable/testable.
- [x] Commit continuously as each logical slice is completed.
- [x] Use commit format: `type(scope): summary`.
- [x] Use types: `chore`, `feat`, `fix`, `refactor`, `test`, `docs`, `style`.
- [x] Run `git status` before each commit.
- [x] Run project checks (for example `npm run build`) before each commit.
- [x] Keep formatter-only changes in separate `style(...)` commits.

### Commit Sequence Status

- [x] `chore(setup): scaffold vue + typescript app`
- [x] `feat(core-types): add instruction, stage, and cpu state models`
- [x] `feat(parser): add machine-code parser and validation`
- [x] `feat(simulator): implement 5-stage tick and pipeline advancement`
- [x] `feat(hazards): add RAW/load-use stall handling`
- [x] `feat(forwarding): add configurable forwarding paths`
- [x] `feat(history): add immutable cycle snapshots and metrics`
- [x] `feat(ui-diagram): render cpu internals and stage occupancy`
- [x] `feat(ui-controls): add play pause step reset and speed control`
- [x] `feat(ui-program-editor): add editable machine-code input`
- [x] `feat(ui-timeline): add cycle scrubber bound to history`
- [x] `feat(ui-overlays): add hazard and forwarding visual overlays`
- [x] `feat(demo): add default ilp demo program and legend`
- [x] `test(core): add parser, hazard, forwarding, and snapshot tests`
- [x] `docs(readme): add usage and simulation behavior notes`

### Decisions

- [x] Stack: Vue + TypeScript.
- [x] Model: Educational 5-stage integer pipeline.
- [x] Required v1 controls: play/pause/step, speed slider, editable machine-code input, timeline scrubber, forwarding/hazard toggles.
- [x] Exclusions: backend services, superscalar/out-of-order execution, mandatory branch prediction in v1.
