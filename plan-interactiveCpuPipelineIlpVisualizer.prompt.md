## Plan: Interactive CPU Pipeline ILP Visualizer

Build a Vue + TypeScript single-page app that simulates a 5-stage integer pipeline and visualizes instruction flow through CPU internals in real time. The recommended approach is simulation-core first, then bind immutable per-cycle snapshots to an interactive diagram with controls and history replay.

**Steps**

1. Phase 1: Foundation
2. Initialize a Vue + TypeScript app structure with strict separation between simulation engine and UI state.
3. Lock v1 boundaries: 5 stages (IF/ID/EX/MEM/WB), integer ops, educational hazard model, no backend.
4. Define core types for instructions, pipeline stages, register file, memory, hazard events, forwarding events, and cycle snapshots.

5. Phase 2: Deterministic simulation engine (blocks downstream UI correctness)
6. Implement machine-code parser/validator for editable program input.
7. Implement cycle tick order: WB commit, MEM access, EX execute, ID decode/hazard check, IF fetch/PC update.
8. Implement stage advancement, bubble insertion, and stall behavior with immutable snapshot output each cycle.
9. Implement hazard logic: RAW detection, load-use stalls, forwarding paths controlled by toggles.
10. Store full cycle history and derived metrics (CPI, stalls, forwarding count).

11. Phase 3: CPU internals visualization
12. Build an interactive CPU diagram with ALU, register file, data memory, pipeline registers, and connecting buses.
13. Render per-stage instruction occupancy per cycle.
14. Animate data movement (operand read, ALU result, memory transfer, writeback).
15. Overlay hazards/forwarding directly on the datapath (bubble markers, bypass arrows, stall labels).
16. Add side views for register deltas, memory deltas, and event log.

17. Phase 4: Interactivity and controls
18. Add Play, Pause, Step, Reset controls.
19. Add speed slider for tick cadence.
20. Add editable machine-code program editor with inline parse errors and apply/load flow.
21. Add cycle timeline scrubber bound to history snapshots.
22. Add forwarding/hazard toggles and deterministic rerun when settings change.

23. Phase 5: Demo and UX polish
24. Ship a default demo program that clearly shows ILP, a load-use hazard, and forwarding benefit.
25. Add legend/onboarding for stage colors, bubbles, and bypass arrows.
26. Ensure responsive behavior on desktop/mobile with readable diagram and controls.

27. Phase 6: Verification
28. Unit-test parser, stage transitions, hazards, and forwarding.
29. Add golden cycle-by-cycle scenarios with forwarding on/off.
30. Verify deterministic replay: stepping and scrubbing always match stored snapshots.
31. Manual-check control synchronization and visual correctness of datapath highlights.
32. Validate responsive layout manually at multiple viewport widths.

**Commit strategy (atomic and logical)**

1. Commit only one logical change per commit. Do not mix refactors, feature work, and formatting in the same commit.
2. Keep each commit buildable and testable. If tests are not available yet, verify the app runs before committing.
3. Commit continuously as you complete each logical slice. Do not wait until the end of the project to batch commits.
4. Use this commit message format: `type(scope): summary`.
5. Recommended types: `chore`, `feat`, `fix`, `refactor`, `test`, `docs`, `style`.
6. Commit in this order so history mirrors the plan phases:
7. `chore(setup): scaffold vue + typescript app`
8. `feat(core-types): add instruction, stage, and cpu state models`
9. `feat(parser): add machine-code parser and validation`
10. `feat(simulator): implement 5-stage tick and pipeline advancement`
11. `feat(hazards): add RAW/load-use stall handling`
12. `feat(forwarding): add configurable forwarding paths`
13. `feat(history): add immutable cycle snapshots and metrics`
14. `feat(ui-diagram): render cpu internals and stage occupancy`
15. `feat(ui-controls): add play pause step reset and speed control`
16. `feat(ui-program-editor): add editable machine-code input`
17. `feat(ui-timeline): add cycle scrubber bound to history`
18. `feat(ui-overlays): add hazard and forwarding visual overlays`
19. `feat(demo): add default ilp demo program and legend`
20. `test(core): add parser, hazard, forwarding, and snapshot tests`
21. `docs(readme): add usage and simulation behavior notes`
22. Before each commit run:
23. `git status` to confirm only intended files are staged.
24. Project checks (for example `npm run test`, `npm run build`) relevant to the changed area.
25. `git add -p` when a file contains unrelated hunks, to keep commit scope atomic.
26. Avoid noisy commits:
27. Commit formatter-only changes separately as `style(...)`.
28. Never commit generated artifacts unless the repository policy explicitly requires them.
29. For bug fixes, include a focused test in the same commit when possible.

**Relevant files**

- Repository is currently empty, so there are no existing files to modify.
- Implementation will create a standard Vue + TypeScript structure for simulation core, UI components, demo programs, and tests.

**Verification**

1. Type-check and run unit tests for simulation logic.
2. Compare expected versus actual stage occupancy per cycle for known programs.
3. Confirm hazard/forwarding toggles change behavior exactly as intended.
4. Confirm timeline scrubber reproduces exact historical states.
5. Confirm mobile and desktop usability for the CPU diagram and controls.

**Decisions captured**

- Stack: Vue + TypeScript.
- Model: Educational 5-stage integer pipeline.
- Required v1 controls: play/pause/step, speed slider, editable machine-code input, timeline scrubber, forwarding/hazard toggles.
- Exclusions: backend services, superscalar/out-of-order execution, mandatory branch prediction in v1.

Plan is saved in session memory and ready for handoff. If you want, I can refine this with a stricter milestone breakdown (for example, 2-hour implementation slices with explicit acceptance criteria per slice).
