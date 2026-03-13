<script setup lang="ts">
import { computed, onUnmounted, reactive, watch } from "vue";

import { PIPELINE_STAGES } from "./simulator/types";
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
  const maxCycle = history[history.length - 1].cycle;
  return ui.machine.program.map((instr) => {
    const cells: Array<{
      stage: string;
      type: "active" | "bubble" | "stall" | "forward" | "empty";
    }> = [];
    for (let c = 1; c <= maxCycle; c++) {
      const snap = history.find((s) => s.cycle === c);
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
    <section class="controls-bar panel">
      <div class="controls-left">
        <button class="btn btn--icon" title="Reset" @click="handleReset">
          ⏮
        </button>
        <button class="btn btn--icon" title="Step forward" @click="handleStep">
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
          Forwarding
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
          RAW detection
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
          Load-use detection
        </label>
      </div>
    </section>

    <!-- Pipeline stages -->
    <section class="panel">
      <h2 class="section-title">
        Pipeline Stages — Cycle {{ displayedCycle }}
      </h2>
      <div class="stages-row">
        <template v-for="(row, i) in displayedStages" :key="row.stage">
          <div
            class="stage-box"
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
            <span class="stage-name">{{ row.stage }}</span>
            <span class="stage-instr">{{ row.label }}</span>
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
        />
        <span class="scrub-label">C{{ scrubberMax }}</span>
        <span
          class="scrub-live"
          :class="{ active: ui.selectedCycle === null }"
          @click="ui.selectedCycle = null"
          >LIVE</span
        >
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
          <dl class="metrics-grid">
            <dt>Cycles</dt>
            <dd>{{ ui.machine.metrics.cycles }}</dd>
            <dt>Committed</dt>
            <dd>{{ ui.machine.metrics.committedInstructions }}</dd>
            <dt>CPI</dt>
            <dd>{{ ui.machine.metrics.cpi.toFixed(2) }}</dd>
            <dt>Stalls</dt>
            <dd>{{ ui.machine.metrics.stallCount }}</dd>
            <dt>Bubbles</dt>
            <dd>{{ ui.machine.metrics.bubbleCount }}</dd>
            <dt>Forwards</dt>
            <dd>{{ ui.machine.metrics.forwardingCount }}</dd>
          </dl>
        </section>

        <!-- Legend -->
        <section class="panel">
          <h2 class="section-title">Legend</h2>
          <ul class="legend">
            <li>
              <span class="swatch swatch--occupied"></span> Active instruction
            </li>
            <li>
              <span class="swatch swatch--bubble"></span> Bubble (inserted
              stall)
            </li>
            <li><span class="swatch swatch--empty"></span> Empty stage</li>
            <li>
              <span class="swatch swatch--forward"></span> Forwarding
              destination
            </li>
            <li>
              <span class="swatch swatch--stall"></span> Stall detected here
            </li>
            <li>
              <span class="tag tag--fwd" style="font-size: 0.7rem">FWD</span>
              MEM→EX bypass
            </li>
            <li>
              <span class="tag tag--stall" style="font-size: 0.7rem"
                >STALL</span
              >
              RAW / load-use stall
            </li>
          </ul>
        </section>
      </div>

      <!-- Right: Waterfall timeline + state -->
      <div class="right-col">
        <!-- Cycle waterfall diagram -->
        <section class="panel" v-if="waterfallRows.length > 0">
          <h2 class="section-title">Pipeline Waterfall</h2>
          <div class="waterfall-scroll">
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
                    {{ row.instr.rawText }}
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
                    {{ cell.stage }}
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
            <li
              v-for="(ev, i) in eventLog"
              :key="i"
              :class="ev.kind === 'forward' ? 'ev-forward' : 'ev-hazard'"
            >
              {{ ev.text }}
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.2rem 1rem 3rem;
  display: grid;
  gap: 0.85rem;
}

/* Header */
.app-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem 1.2rem;
  background: #fff;
  border: 1px solid #dde6f0;
  border-radius: 12px;
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
  border-radius: 12px;
  padding: 1rem 1.1rem;
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.controls-left {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.controls-speed {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.controls-toggles {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  align-items: center;
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
  font-size: 0.85rem;
  padding: 0.38rem 0.9rem;
  transition: background 0.15s;
}
.btn--icon {
  background: #eef4fb;
  color: #1a4a82;
  padding: 0.38rem 0.7rem;
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
  gap: 0.3rem;
  flex-wrap: wrap;
}
.stage-box {
  flex: 1 1 100px;
  min-width: 90px;
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
  gap: 0.5rem;
}
.scrubber {
  flex: 1;
  accent-color: #1589ee;
}
.scrub-label {
  font-size: 0.78rem;
  color: #55708a;
  min-width: 2rem;
  text-align: center;
}
.scrub-live {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  background: #eef4fb;
  color: #1a4a82;
  cursor: pointer;
  border: 1px solid #c0d8f0;
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
  font-size: 0.82rem;
  border: 1px solid #c8d8ea;
  border-radius: 7px;
  padding: 0.5rem 0.7rem;
  background: #f8fbff;
  resize: vertical;
  line-height: 1.6;
  color: #1a2e45;
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
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem 0.8rem;
  margin: 0;
}
dt {
  font-size: 0.8rem;
  color: #55708a;
}
dd {
  margin: 0;
  font-size: 0.9rem;
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
  color: #1a2e45;
  font-family: monospace;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
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
  gap: 0.4rem;
}
.reg-entry {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  background: #eef4fb;
  border-radius: 6px;
  padding: 0.2rem 0.55rem;
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
  gap: 0.22rem;
  max-height: 200px;
  overflow-y: auto;
}
.event-log li {
  font-size: 0.76rem;
  border-radius: 5px;
  padding: 0.2rem 0.5rem;
  font-family: monospace;
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
@media (max-width: 600px) {
  .stages-row {
    gap: 0.2rem;
  }
  .stage-box {
    min-width: 60px;
  }
  .controls-bar {
    gap: 0.6rem;
  }
}
</style>
