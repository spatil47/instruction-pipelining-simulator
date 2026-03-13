<script setup lang="ts">
import { computed, onUnmounted, reactive, watch } from "vue";

import { PIPELINE_STAGES } from "./simulator/types";
import GlossaryTooltip from "./components/GlossaryTooltip.vue";
import GlossaryPanel from "./components/GlossaryPanel.vue";
import InstructionText from "./components/InstructionText.vue";
import EventLogEntry from "./components/EventLogEntry.vue";
import type { CycleSnapshot } from "./simulator/types";
import {
  applyConfig,
  applyProgram,
  createInitialUiState,
  resetSimulation,
  startPlay,
  stepForward,
  stopPlay,
} from "./ui/state";

const ui = reactive(createInitialUiState());

onUnmounted(() => {
  if (ui.intervalId !== null) clearInterval(ui.intervalId);
});

// When speed changes while running, restart the interval with new delay.
watch(
  () => ui.tickMs,
  (newMs) => {
    if (ui.isRunning) {
      stopPlay(ui);
      ui.tickMs = newMs;
      startPlay(ui);
    }
  },
);

// ----- Displayed snapshot -----
const displayedSnapshot = computed<CycleSnapshot | null>(() => {
  const history = ui.machine.history;
  if (history.length === 0) return null;
  if (ui.selectedCycle === null) return history[history.length - 1];
  const idx = history.findIndex((s) => s.cycle === ui.selectedCycle);
  return idx >= 0 ? history[idx] : history[history.length - 1];
});

const displayedStages = computed(() =>
  PIPELINE_STAGES.map((stage) => {
    const slot =
      displayedSnapshot.value?.stages[stage] ?? ui.machine.stages[stage];
    const instr = ui.machine.program.find((i) => i.id === slot.instructionId);
    return {
      stage,
      slot,
      label: slot.isBubble ? "BUBBLE" : (instr?.rawText ?? "—"),
    };
  }),
);

// ----- Waterfall / cycle timeline -----
const waterfallRows = computed(() => {
  const history = ui.machine.history;
  if (history.length === 0) return [];

  // History is append-only and cycle-indexed starting at 1. Using direct
  // index access avoids repeated O(n) lookups while generating dense tables.
  const maxCycle = history[history.length - 1].cycle;
  const cycleToSnapshot = new Map(history.map((snap) => [snap.cycle, snap]));

  return ui.machine.program.map((instr) => {
    const cells: Array<{
      stage: string;
      type: "active" | "bubble" | "stall" | "forward" | "empty";
    }> = [];
    for (let c = 1; c <= maxCycle; c++) {
      const snap = cycleToSnapshot.get(c);
      if (!snap) {
        cells.push({ stage: "", type: "empty" });
        continue;
      }
      let foundStage = "";
      let cellType: (typeof cells)[0]["type"] = "empty";
      for (const s of PIPELINE_STAGES) {
        if (snap.stages[s].instructionId === instr.id) {
          foundStage = s;
          cellType = snap.stages[s].isBubble ? "bubble" : "active";
          break;
        }
      }
      if (foundStage && cellType === "active") {
        const isForward = snap.forwarding.some(
          (f) => snap.stages[f.toStage]?.instructionId === instr.id,
        );
        const isHazard = snap.hazards.some(
          (h) => h.blockedInstructionId === instr.id,
        );
        if (isForward) cellType = "forward";
        else if (isHazard) cellType = "stall";
      }
      cells.push({ stage: foundStage, type: cellType });
    }
    return { instr, cells };
  });
});

const cycleNumbers = computed(() => ui.machine.history.map((s) => s.cycle));

// ----- Register file (non-zero) -----
const nonZeroRegisters = computed(() => {
  const rf = displayedSnapshot.value?.registerFile ?? ui.machine.registerFile;
  return Object.entries(rf)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => ({ name: k, value: v }));
});

// ----- Event log (last 20 events from live machine) -----
const eventLog = computed(() => {
  const events: Array<{
    cycle: number;
    kind: "hazard" | "forward";
    text: string;
  }> = [];
  for (const snap of ui.machine.history) {
    for (const h of snap.hazards) {
      events.push({
        cycle: h.cycle,
        kind: "hazard",
        text: `C${h.cycle} [${h.type}] ${h.description}`,
      });
    }
    for (const f of snap.forwarding) {
      events.push({
        cycle: f.cycle,
        kind: "forward",
        text: `C${f.cycle} [FWD] ${f.fromStage}→${f.toStage} ${f.register}=${f.value}`,
      });
    }
  }
  return events.slice(-24).reverse();
});

// ----- Controls -----
function handlePlayPause() {
  if (ui.isRunning) stopPlay(ui);
  else startPlay(ui);
}

function handleStep() {
  stopPlay(ui);
  stepForward(ui);
}

function handleReset() {
  resetSimulation(ui);
}

function handleApplyProgram() {
  applyProgram(ui);
}

function handleConfigChange(
  key: "enableForwarding" | "detectRawHazards" | "detectLoadUseHazards",
  value: boolean,
) {
  applyConfig(ui, { [key]: value });
}

const scrubberMax = computed(() => Math.max(0, ui.machine.history.length));
const scrubberValue = computed({
  get() {
    if (ui.selectedCycle === null) return scrubberMax.value;
    const idx = ui.machine.history.findIndex(
      (s) => s.cycle === ui.selectedCycle,
    );
    return idx >= 0 ? idx + 1 : scrubberMax.value;
  },
  set(v: number) {
    if (v >= scrubberMax.value) {
      ui.selectedCycle = null;
    } else {
      ui.selectedCycle = ui.machine.history[v - 1]?.cycle ?? null;
    }
  },
});

const displayedCycle = computed(
  () => displayedSnapshot.value?.cycle ?? ui.machine.cycle,
);
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-title">
        <span class="eyebrow">CPU Pipeline Visualizer</span>
        <h1>Interactive ILP Simulator</h1>
      </div>
      <div class="header-meta">
        <span class="badge">5-stage integer pipeline</span>
        <span class="badge badge--cycle">Cycle {{ displayedCycle }}</span>
      </div>
    </header>

    <!-- Controls -->
    <section class="controls-bar panel" aria-label="Simulation controls">
      <div class="controls-left">
        <button
          class="btn btn--icon"
          title="Reset"
          aria-label="Reset simulation"
          @click="handleReset"
        >
          ⏮
        </button>
        <button
          class="btn btn--icon"
          title="Step forward"
          aria-label="Step one cycle"
          @click="handleStep"
        >
          ⏭
        </button>
        <button class="btn btn--primary" @click="handlePlayPause">
          {{ ui.isRunning ? "⏸ Pause" : "▶ Play" }}
        </button>
      </div>
      <div class="controls-speed">
        <label class="ctrl-label">Speed</label>
        <input
          v-model.number="ui.tickMs"
          type="range"
          min="80"
          max="2000"
          step="40"
          class="speed-slider"
        />
        <span class="speed-val">{{ ui.tickMs }}ms</span>
      </div>
      <div class="controls-toggles">
        <label class="toggle-label">
          <input
            type="checkbox"
            :checked="ui.machine.config.enableForwarding"
            @change="
              handleConfigChange(
                'enableForwarding',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <GlossaryTooltip term="enableForwarding">Forwarding</GlossaryTooltip>
        </label>
        <label class="toggle-label">
          <input
            type="checkbox"
            :checked="ui.machine.config.detectRawHazards"
            @change="
              handleConfigChange(
                'detectRawHazards',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <GlossaryTooltip term="RAW">RAW</GlossaryTooltip> detection
        </label>
        <label class="toggle-label">
          <input
            type="checkbox"
            :checked="ui.machine.config.detectLoadUseHazards"
            @change="
              handleConfigChange(
                'detectLoadUseHazards',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <GlossaryTooltip term="LOAD_USE">Load-use</GlossaryTooltip> detection
        </label>
      </div>
    </section>

    <!-- Pipeline stages -->
    <section class="panel">
      <h2 class="section-title">
        Pipeline Stages — Cycle {{ displayedCycle }}
      </h2>
      <div class="stages-row" role="list" aria-label="Pipeline stages">
        <template v-for="(row, i) in displayedStages" :key="row.stage">
          <div
            class="stage-box"
            role="listitem"
            :class="{
              'stage-box--bubble': row.slot.isBubble,
              'stage-box--occupied':
                !row.slot.isBubble && row.slot.instructionId !== null,
              'stage-box--empty':
                !row.slot.isBubble && row.slot.instructionId === null,
              'stage-box--forward': displayedSnapshot?.forwarding.some(
                (f) => f.toStage === row.stage,
              ),
              'stage-box--stall': displayedSnapshot?.hazards.some(
                (h) => h.stage === row.stage,
              ),
            }"
          >
            <GlossaryTooltip :term="row.stage"
              ><span class="stage-name">{{ row.stage }}</span></GlossaryTooltip
            >
            <span class="stage-instr"
              ><InstructionText :raw-text="row.label"
            /></span>
          </div>
          <div v-if="i < displayedStages.length - 1" class="stage-arrow">→</div>
        </template>
      </div>

      <!-- Forwarding / hazard overlays for current display cycle -->
      <div
        v-if="
          displayedSnapshot &&
          (displayedSnapshot.forwarding.length > 0 ||
            displayedSnapshot.hazards.length > 0)
        "
        class="overlay-tags"
      >
        <span
          v-for="(f, fi) in displayedSnapshot.forwarding"
          :key="'fwd-' + fi"
          class="tag tag--fwd"
        >
          ↻ FWD {{ f.fromStage }}→{{ f.toStage }}: {{ f.register }}={{
            f.value
          }}
        </span>
        <span
          v-for="(h, hi) in displayedSnapshot.hazards"
          :key="'hz-' + hi"
          class="tag tag--stall"
        >
          ⚠ {{ h.type }}: {{ h.description }}
        </span>
      </div>
    </section>

    <!-- Timeline scrubber -->
    <section v-if="ui.machine.history.length > 0" class="panel timeline-panel">
      <h2 class="section-title">Timeline</h2>
      <div class="scrubber-row">
        <span class="scrub-label">C1</span>
        <input
          v-model.number="scrubberValue"
          type="range"
          min="1"
          :max="scrubberMax"
          class="scrubber"
          aria-label="Timeline cycle selector"
        />
        <span class="scrub-label">C{{ scrubberMax }}</span>
        <button
          type="button"
          class="scrub-live"
          :class="{ active: ui.selectedCycle === null }"
          @click="ui.selectedCycle = null"
        >
          LIVE
        </button>
      </div>
    </section>

    <div class="main-grid">
      <!-- Left: Program editor + metrics -->
      <div class="left-col">
        <section class="panel">
          <h2 class="section-title">Program Editor</h2>
          <textarea
            v-model="ui.programText"
            class="program-editor"
            spellcheck="false"
            rows="10"
            placeholder="LW R1, 0(R0)&#10;ADD R2, R1, R3"
          ></textarea>
          <div v-if="ui.parseErrors.length > 0" class="parse-errors">
            <div
              v-for="err in ui.parseErrors"
              :key="err.line"
              class="parse-error"
            >
              Line {{ err.line }}: {{ err.message }}
            </div>
          </div>
          <button class="btn btn--apply" @click="handleApplyProgram">
            Apply &amp; Reset
          </button>
        </section>

        <section class="panel">
          <h2 class="section-title">Metrics</h2>
          <div class="metrics-cards">
            <div class="metric-card">
              <span class="metric-label">Cycles</span>
              <span class="metric-value">{{ ui.machine.metrics.cycles }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label"
                ><GlossaryTooltip term="CPI">Committed</GlossaryTooltip></span
              >
              <span class="metric-value">{{
                ui.machine.metrics.committedInstructions
              }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label"
                ><GlossaryTooltip term="CPI">CPI</GlossaryTooltip></span
              >
              <span class="metric-value">{{
                ui.machine.metrics.cpi.toFixed(2)
              }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label"
                ><GlossaryTooltip term="stall">Stalls</GlossaryTooltip></span
              >
              <span class="metric-value">{{
                ui.machine.metrics.stallCount
              }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label"
                ><GlossaryTooltip term="bubble">Bubbles</GlossaryTooltip></span
              >
              <span class="metric-value">{{
                ui.machine.metrics.bubbleCount
              }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label"
                ><GlossaryTooltip term="forwarding"
                  >Forwards</GlossaryTooltip
                ></span
              >
              <span class="metric-value">{{
                ui.machine.metrics.forwardingCount
              }}</span>
            </div>
          </div>
        </section>

        <!-- Legend -->
        <section class="panel">
          <h2 class="section-title">Legend</h2>
          <ul class="legend">
            <li>
              <span class="swatch swatch--occupied"></span> Active instruction
            </li>
            <li>
              <span class="swatch swatch--bubble"></span>
              <GlossaryTooltip term="bubble">Bubble</GlossaryTooltip> (inserted
              stall)
            </li>
            <li><span class="swatch swatch--empty"></span> Empty stage</li>
            <li>
              <span class="swatch swatch--forward"></span>
              <GlossaryTooltip term="forwarding">Forwarding</GlossaryTooltip>
              destination
            </li>
            <li>
              <span class="swatch swatch--stall"></span>
              <GlossaryTooltip term="stall">Stall</GlossaryTooltip> detected
              here
            </li>
            <li>
              <span class="tag tag--fwd" style="font-size: 0.7rem">FWD</span>
              <GlossaryTooltip term="MEM_EX_Forward"
                >MEM→EX bypass</GlossaryTooltip
              >
            </li>
            <li>
              <span class="tag tag--stall" style="font-size: 0.7rem"
                >STALL</span
              >
              <GlossaryTooltip term="RAW">RAW</GlossaryTooltip> /
              <GlossaryTooltip term="LOAD_USE">load-use</GlossaryTooltip> stall
            </li>
          </ul>
        </section>
      </div>

      <!-- Right: Waterfall timeline + state -->
      <div class="right-col">
        <!-- Cycle waterfall diagram -->
        <section class="panel" v-if="waterfallRows.length > 0">
          <h2 class="section-title">Pipeline Waterfall</h2>
          <p class="waterfall-hint" aria-hidden="true">
            Swipe horizontally to view more cycles.
          </p>
          <div
            class="waterfall-scroll"
            tabindex="0"
            aria-label="Scrollable waterfall timeline"
          >
            <table class="waterfall">
              <thead>
                <tr>
                  <th class="wf-instr-col">Instruction</th>
                  <th
                    v-for="c in cycleNumbers"
                    :key="c"
                    class="wf-cycle-col"
                    :class="{ 'wf-selected': c === displayedCycle }"
                  >
                    {{ c }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in waterfallRows" :key="row.instr.id">
                  <td class="wf-instr-label" :title="row.instr.rawText">
                    <InstructionText :raw-text="row.instr.rawText" />
                  </td>
                  <td
                    v-for="(cell, ci) in row.cells"
                    :key="ci"
                    class="wf-cell"
                    :class="{
                      'wf-active': cell.type === 'active',
                      'wf-bubble': cell.type === 'bubble',
                      'wf-stall': cell.type === 'stall',
                      'wf-forward': cell.type === 'forward',
                    }"
                    :title="cell.stage || ''"
                  >
                    <GlossaryTooltip v-if="cell.stage" :term="cell.stage">{{
                      cell.stage
                    }}</GlossaryTooltip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Register file -->
        <section class="panel">
          <h2 class="section-title">Register File</h2>
          <div v-if="nonZeroRegisters.length === 0" class="empty-state">
            All registers are zero.
          </div>
          <div v-else class="reg-grid">
            <div v-for="r in nonZeroRegisters" :key="r.name" class="reg-entry">
              <span class="reg-name">{{ r.name }}</span>
              <span class="reg-val">{{ r.value }}</span>
            </div>
          </div>
        </section>

        <!-- Event log -->
        <section class="panel" v-if="eventLog.length > 0">
          <h2 class="section-title">Event Log</h2>
          <ul class="event-log">
            <EventLogEntry v-for="(ev, i) in eventLog" :key="i" :ev="ev" />
          </ul>
        </section>
      </div>
    </div>
    <GlossaryPanel />
  </div>
</template>

<style scoped>
.app {
  --space-1: 0.4rem;
  --space-2: 0.7rem;
  --space-3: 1rem;
  --space-4: 1.3rem;
  --radius-panel: 12px;
  --tap-target: 44px;
  --text-sm: 0.82rem;
  --text-body: 0.9rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-3) 3rem;
  display: grid;
  gap: var(--space-2);
  overflow-x: clip;
}

/* Header */
.app-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: var(--space-3) 1.2rem;
  background: #fff;
  border: 1px solid #dde6f0;
  border-radius: var(--radius-panel);
}
.eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #0c6ecc;
  display: block;
}
h1 {
  margin: 0.2rem 0 0;
  font-size: clamp(1.3rem, 2.8vw, 1.8rem);
  color: #0c223f;
}
.header-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.badge {
  background: #eef4fb;
  color: #1a4a82;
  border-radius: 6px;
  padding: 0.2rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
}
.badge--cycle {
  background: #e8faf2;
  color: #0e6647;
}

/* Panels */
.panel {
  background: #fff;
  border: 1px solid #dde6f0;
  border-radius: var(--radius-panel);
  padding: var(--space-3) 1.1rem;
}
h2.section-title {
  margin: 0 0 0.7rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #3b5275;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Controls */
.controls-bar {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: var(--space-3);
}
.controls-left {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}
.controls-speed {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.controls-toggles {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}
.ctrl-label {
  font-size: 0.82rem;
  color: #55708a;
  font-weight: 600;
}
.speed-slider {
  width: 110px;
  accent-color: #1589ee;
}
.speed-val {
  font-size: 0.78rem;
  color: #55708a;
  min-width: 3.5rem;
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: #2a435f;
  cursor: pointer;
  user-select: none;
}
.toggle-label input {
  accent-color: #1589ee;
}

/* Buttons */
.btn {
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-weight: 600;
  font-size: var(--text-sm);
  min-height: var(--tap-target);
  padding: 0.45rem 0.9rem;
  transition: background 0.15s;
}
.btn--icon {
  background: #eef4fb;
  color: #1a4a82;
  min-width: var(--tap-target);
  padding: 0.45rem 0.75rem;
  font-size: 1rem;
}
.btn--icon:hover {
  background: #d9e8f8;
}
.btn--primary {
  background: #1589ee;
  color: #fff;
}
.btn--primary:hover {
  background: #0c6ecc;
}
.btn--apply {
  background: #0e9c6b;
  color: #fff;
  margin-top: 0.5rem;
}
.btn--apply:hover {
  background: #0b7d56;
}

/* Pipeline stages */
.stages-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  overflow-x: auto;
  padding-bottom: 0.15rem;
  scrollbar-width: thin;
}
.stage-box {
  flex: 0 0 150px;
  min-width: 150px;
  max-width: 180px;
  border-radius: 10px;
  padding: 0.65rem 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  border: 2px solid transparent;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.stage-name {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.stage-instr {
  font-size: 0.78rem;
  text-align: center;
  word-break: break-word;
}

.stage-box--empty {
  background: #f4f7fa;
  border-color: #dde6f0;
  color: #96aabf;
}
.stage-box--occupied {
  background: #e8f2ff;
  border-color: #7ab3ef;
  color: #0c3060;
}
.stage-box--bubble {
  background: #fff5e0;
  border-color: #f0c040;
  color: #7a5400;
}
.stage-box--forward {
  background: #e6f9f0;
  border-color: #34c98a;
  color: #0b4e31;
}
.stage-box--stall {
  background: #fff0f0;
  border-color: #e05050;
  color: #7a1010;
}

.stage-arrow {
  font-size: 1.2rem;
  color: #96aabf;
  flex-shrink: 0;
}

.overlay-tags {
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.tag {
  display: inline-block;
  border-radius: 5px;
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.tag--fwd {
  background: #e6f9f0;
  color: #0b7a4e;
  border: 1px solid #34c98a;
}
.tag--stall {
  background: #fff0f0;
  color: #8b2020;
  border: 1px solid #e05050;
}

/* Timeline scrubber */
.timeline-panel {
}
.scrubber-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.scrubber {
  flex: 1;
  accent-color: #1589ee;
  min-height: var(--tap-target);
}
.scrub-label {
  font-size: 0.78rem;
  color: #55708a;
  min-width: 2rem;
  text-align: center;
}
.scrub-live {
  border: 1px solid #c0d8f0;
  font-size: 0.75rem;
  font-weight: 700;
  min-height: var(--tap-target);
  padding: 0.2rem 0.65rem;
  border-radius: 5px;
  background: #eef4fb;
  color: #1a4a82;
  cursor: pointer;
}
.scrub-live.active {
  background: #0e9c6b;
  color: #fff;
  border-color: #0e9c6b;
}

/* Main two-column grid */
.main-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 0.85rem;
  align-items: start;
}
.left-col,
.right-col {
  display: grid;
  gap: 0.85rem;
}

/* Program editor */
.program-editor {
  width: 100%;
  font-family: "JetBrains Mono", "Fira Mono", "Consolas", monospace;
  font-size: var(--text-sm);
  border: 1px solid #c8d8ea;
  border-radius: 7px;
  padding: 0.5rem 0.7rem;
  background: #f8fbff;
  resize: vertical;
  line-height: 1.6;
  color: #1a2e45;
  min-height: 11rem;
}
.program-editor:focus {
  outline: none;
  border-color: #1589ee;
}
.parse-errors {
  margin-top: 0.4rem;
  display: grid;
  gap: 0.2rem;
}
.parse-error {
  font-size: 0.78rem;
  color: #b02020;
  background: #fff0f0;
  border-radius: 5px;
  padding: 0.2rem 0.5rem;
}

/* Metrics */
.metrics-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}
.metric-card {
  border: 1px solid #dbe7f4;
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  background: #f7fbff;
  display: grid;
  gap: 0.25rem;
}
.metric-label {
  font-size: 0.76rem;
  color: #55708a;
}
.metric-value {
  font-size: 0.94rem;
  font-weight: 700;
  color: #0c223f;
}

/* Legend */
.legend {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
}
.legend li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: #2a435f;
}
.swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 2px solid transparent;
}
.swatch--occupied {
  background: #e8f2ff;
  border-color: #7ab3ef;
}
.swatch--bubble {
  background: #fff5e0;
  border-color: #f0c040;
}
.swatch--empty {
  background: #f4f7fa;
  border-color: #dde6f0;
}
.swatch--forward {
  background: #e6f9f0;
  border-color: #34c98a;
}
.swatch--stall {
  background: #fff0f0;
  border-color: #e05050;
}

/* Waterfall */
.waterfall-scroll {
  overflow-x: auto;
  border: 1px solid #e0eaf4;
  border-radius: 8px;
  background: linear-gradient(90deg, #f8fbff, #ffffff 42%);
  -webkit-overflow-scrolling: touch;
}
.waterfall-hint {
  margin: 0 0 0.35rem;
  font-size: 0.74rem;
  color: #55708a;
}
.waterfall {
  border-collapse: collapse;
  font-size: 0.78rem;
  white-space: nowrap;
}
.waterfall th,
.waterfall td {
  padding: 0.28rem 0.35rem;
  border: 1px solid #e0eaf4;
}
.wf-instr-col {
  background: #f4f7fa;
  font-weight: 600;
  color: #2a435f;
  text-align: left;
  min-width: 140px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  position: sticky;
  left: 0;
  z-index: 2;
}
.wf-cycle-col {
  background: #f4f7fa;
  color: #55708a;
  text-align: center;
  min-width: 28px;
}
.wf-cycle-col.wf-selected {
  background: #e8f2ff;
  color: #0c3060;
  font-weight: 700;
}
.wf-instr-label {
  background: #ffffff;
  color: #1a2e45;
  font-family: monospace;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  position: sticky;
  left: 0;
  z-index: 1;
}
.wf-cell {
  text-align: center;
  color: #2a435f;
  font-weight: 600;
}
.wf-active {
  background: #ddeeff;
  color: #0c3060;
}
.wf-bubble {
  background: #fff3cc;
  color: #7a5400;
}
.wf-stall {
  background: #ffe4e4;
  color: #8b2020;
}
.wf-forward {
  background: #d4f5e4;
  color: #0b4e31;
}

/* Register file */
.reg-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.reg-entry {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  background: #eef4fb;
  border-radius: 6px;
  padding: 0.3rem 0.65rem;
}
.reg-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1a4a82;
}
.reg-val {
  font-size: 0.78rem;
  color: #0c223f;
}
.empty-state {
  font-size: 0.82rem;
  color: #96aabf;
}

/* Event log */
.event-log {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
  max-height: 200px;
  overflow-y: auto;
}
.btn:focus-visible,
.toggle-label input:focus-visible,
.scrubber:focus-visible,
.scrub-live:focus-visible,
.waterfall-scroll:focus-visible,
.panel-close:focus-visible,
.related-chip:focus-visible {
  outline: 2px solid #1589ee;
  outline-offset: 2px;
}
.ev-forward {
  background: #e6f9f0;
  color: #0b4e31;
}
.ev-hazard {
  background: #fff0f0;
  color: #8b2020;
}

@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .app {
    --space-3: 0.85rem;
    --space-4: 1rem;
    --text-sm: 0.86rem;
  }
  .app-header {
    align-items: flex-start;
  }
  .header-meta {
    width: 100%;
  }
  .controls-bar {
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }
  .controls-left {
    grid-column: 1 / -1;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .controls-left .btn {
    width: 100%;
  }
  .controls-speed {
    min-width: 0;
    width: 100%;
  }
  .speed-slider {
    flex: 1;
    min-width: 0;
  }
  .controls-toggles {
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    gap: 0.45rem;
  }
  .metrics-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .app {
    --radius-panel: 10px;
    --text-sm: 0.88rem;
    --text-body: 0.96rem;
  }
  .panel {
    padding: 0.85rem 0.9rem;
  }
  .stages-row {
    gap: 0.2rem;
  }
  .stage-box {
    flex-basis: 135px;
    min-width: 135px;
  }
  .stage-instr {
    font-size: 0.8rem;
  }
  .scrubber-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.35rem;
  }
  .scrubber {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .scrub-live {
    grid-column: 2;
    justify-self: center;
  }
  .program-editor {
    min-height: 13rem;
    line-height: 1.75;
  }
  .parse-error {
    font-size: 0.82rem;
  }
  .metrics-cards {
    grid-template-columns: 1fr;
  }
  .reg-name,
  .reg-val {
    font-size: 0.84rem;
  }
  .event-log {
    max-height: 240px;
  }
  .waterfall {
    font-size: 0.82rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
