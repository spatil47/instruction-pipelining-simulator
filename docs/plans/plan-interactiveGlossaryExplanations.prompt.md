## Todo: Interactive Glossary Explanations for CPU Pipeline Simulator

Add interactive hover-preview + click-to-pin rich glossary explanations to all terse domain terms across the UI (pipeline stages, opcodes, hazards, metrics, config flags, assembly concepts). Hover shows a small floating preview; clicking any term opens a fixed right-side panel with a full educational entry (definition, syntax, assembly example, ASCII diagram, related terms).

### Phase 1 — Glossary Data Layer

- [ ] Step 1: Create `src/ui/glossary.ts`
  - Centralized `Record<string, GlossaryEntry>` keyed by term ID (e.g., `"IF"`, `"RAW"`, `"CPI"`, `"LW"`)
  - Each entry: `term`, `category`, `preview` (1–2 sentence hover text), `definition` (full paragraph), `syntax?`, `example?`, `diagram?` (ASCII art), `relatedTerms?` (array of term IDs)
  - Terms: all 5 pipeline stages (IF, ID, EX, MEM, WB), all 9 opcodes (ADD, SUB, AND, OR, XOR, ADDI, LW, SW, NOP), hazard types (RAW, LOAD_USE), all 6 metrics (Cycles, Committed, CPI, Stalls, Bubbles, Forwards), concepts (Forwarding, Pipeline, ILP, Bubble, Stall, RegisterFile, PC, ZeroRegister, MEM_EX_Forward), config flags (enableForwarding, detectRawHazards, detectLoadUseHazards), assembly syntax (R-type, I-type, MemoryFormat, Immediate), UI terms (WaterfallDiagram, TimelineScrubber)

- [ ] Step 2: Create `src/ui/useGlossary.ts`
  - Module-level singleton composable (simpler than provide/inject for single-app use)
  - Exports: `activeTerm: Ref<string | null>`, `setActiveTerm(id: string | null): void`, `getEntry(id: string): GlossaryEntry | undefined`

### Phase 2 — Components

- [ ] Step 3: Create `src/components/GlossaryTooltip.vue`
  - Slot-based wrapper; props: `term: string` (glossary key)
  - Adds `cursor: help` + dotted underline (`border-bottom: 1px dotted`) to wrapped content
  - Hover → small absolute-positioned `.tooltip-preview` card (dark background, white text) with `entry.preview`; includes viewport-overflow guard that flips tooltip below when near top of viewport
  - Click → calls `setActiveTerm(term)`; stops event propagation
  - Accessibility: `aria-describedby` linking slot content to tooltip

- [ ] Step 4: Create `src/components/GlossaryPanel.vue`
  - Fixed right sidebar: `position: fixed; right: 0; top: 80px; width: 320px; max-height: calc(100vh - 100px); overflow-y: auto`
  - Animated in/out with CSS `transform: translateX(...)` transition
  - Reads `activeTerm` from `useGlossary` composable
  - Sections: header (term name + category badge + ✕ close button), definition, syntax block (monospace), example block (code style), diagram (`<pre>` ASCII art), related terms chips (clickable → `setActiveTerm`)
  - Closes on: ✕ button click OR Escape key

- [ ] Step 5: Create `src/components/InstructionText.vue`
  - Props: `rawText: string` (e.g., `"LW R1, 0(R0)"`)
  - Splits first whitespace-separated token as opcode, remainder as operands
  - Renders: `<GlossaryTooltip :term="opcode">{{ opcode }}</GlossaryTooltip>{{ operands }}`
  - Falls back to plain text if opcode not in glossary (BUBBLE, —, empty)

- [ ] Step 6 (optional): Create `src/components/EventLogEntry.vue`
  - Renders a single event log line without using `v-html` (avoids XSS)
  - Parses `[RAW]`, `[LOAD_USE]`, `[FWD]` tags from `ev.text` into structured parts
  - Wraps recognized tags in `<GlossaryTooltip>`

### Phase 3 — Integrate Into App.vue

- [ ] Step 7: Import all new components and composable
- [ ] Step 8: Wrap stage name labels
  - `<span class="stage-name">{{ row.stage }}</span>` → `<GlossaryTooltip :term="row.stage"><span class="stage-name">{{ row.stage }}</span></GlossaryTooltip>`
- [ ] Step 9: Wrap stage instruction labels
  - `<span class="stage-instr">{{ row.label }}</span>` → `<span class="stage-instr"><InstructionText :raw-text="row.label" /></span>`
- [ ] Step 10: Wrap config toggle text
  - `"Forwarding"` → `<GlossaryTooltip term="forwarding">Forwarding</GlossaryTooltip>`
  - `"RAW detection"` → `<GlossaryTooltip term="RAW">RAW</GlossaryTooltip> detection`
  - `"Load-use detection"` → `<GlossaryTooltip term="LOAD_USE">Load-use</GlossaryTooltip> detection`
- [ ] Step 11: Wrap metric `<dt>` labels
  - Wrap `CPI`, `Stalls`, `Bubbles`, `Forwards`, `Committed` each in `<GlossaryTooltip>`
- [ ] Step 12: Wrap waterfall stage cells
  - `{{ cell.stage }}` → `<GlossaryTooltip v-if="cell.stage" :term="cell.stage">{{ cell.stage }}</GlossaryTooltip>`
- [ ] Step 13: Wrap waterfall instruction row labels
  - `{{ row.instr.rawText }}` in `wf-instr-label` td → `<InstructionText :raw-text="row.instr.rawText" />`
- [ ] Step 14: Wrap legend items
  - "Bubble (inserted stall)" → wrap "Bubble" (`term="bubble"`)
  - "Forwarding destination" → wrap "Forwarding" (`term="forwarding"`)
  - "Stall detected here" → wrap "Stall" (`term="stall"`)
  - "MEM→EX bypass" tag → wrap in tooltip (`term="MEM_EX_Forward"`)
  - "RAW / load-use stall" tag → wrap "RAW" and "load-use" separately
- [ ] Step 15: Add `<GlossaryPanel />` at end of `.app` div
- [ ] Step 16: Replace event log `<li>` render with `<EventLogEntry :ev="ev" />`

### Relevant Files

- `src/App.vue` — all template integration (Steps 7–16)
- `src/ui/glossary.ts` — new; all ~30 term definitions
- `src/ui/useGlossary.ts` — new; composable
- `src/components/GlossaryTooltip.vue` — new; hover + click trigger
- `src/components/GlossaryPanel.vue` — new; fixed detail panel
- `src/components/InstructionText.vue` — new; opcode wrapper
- `src/components/EventLogEntry.vue` — new; tagged log line renderer

### Verification

1. `npm run dev` → no console errors
2. Hover over "IF" stage name → preview tooltip with stage description
3. Click "IF" → panel slides in with full entry, ASCII pipeline diagram, related terms (ID, EX, etc.)
4. Press Escape → panel closes
5. Click a "Related Terms" chip → panel switches to that entry
6. Hover over opcode in pipeline cell (e.g., "LW" in "LW R1, 0(R0)") → LW entry preview
7. Click opcode → full LW entry in panel
8. Hover "CPI" metric label → preview tooltip
9. "Forwarding" toggle text has hover tooltip
10. `npm run test` → all existing tests pass (no simulator logic changed)

### Decisions

- **Interaction model**: hover = preview tooltip; click = pinned full panel (right sidebar)
- **Dynamic cells**: instruction opcodes in pipeline cells and waterfall also wrapped
- **Explanation depth**: long format — definition, syntax, example, ASCII diagram, related terms
- **No `v-html`**: `EventLogEntry` component parses structured parts to avoid XSS
- **Scope**: only glossary layer changes; zero modifications to simulator engine or UI state
- **Accessibility**: `cursor: help`; `aria-describedby` on hover tooltip; Escape key closes panel

### Further Considerations

1. **Mobile/touch**: Hover preview won't trigger on touch devices. The click-to-panel behavior still works. A `@touchstart` handler on `GlossaryTooltip` that opens the full panel directly can be added if needed.
2. **Tooltip viewport overflow**: Hover tooltips positioned `bottom: 100%` may clip at top of viewport. Include a JS position check in `GlossaryTooltip` that flips the tooltip below when near the top of the viewport.

### Commit Workflow

- Commit one logical change per commit; each commit must be buildable/testable
- Use commit format: `type(scope): summary`
- Use types: `chore`, `feat`, `fix`, `refactor`, `test`, `docs`, `style`
- Run `git status` before each commit
- Run `npm run build` before each commit
- Keep formatter-only changes in separate `style(...)` commits
- Commit as you go — don't commit all at once at the end

### Commit Sequence

- [ ] `feat(glossary): add glossary data and useGlossary composable` — Steps 1–2
- [ ] `feat(glossary): add GlossaryTooltip, GlossaryPanel, and InstructionText components` — Steps 3–6
- [ ] `feat(glossary): integrate tooltip triggers into pipeline stages and waterfall` — Steps 7–13
- [ ] `feat(glossary): wrap legend, metric labels, config toggles, and event log` — Steps 14–16
