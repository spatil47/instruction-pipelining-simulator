<script setup lang="ts">
import { computed, reactive } from "vue";

import { PIPELINE_STAGES } from "./simulator/types";
import { createInitialUiState } from "./ui/state";

const uiState = reactive(createInitialUiState());

const stageRows = computed(() =>
  PIPELINE_STAGES.map((stage) => ({
    stage,
    slot: uiState.machine.stages[stage],
  })),
);

const demoProgram = computed(() => uiState.machine.program);
</script>

<template>
  <main class="layout">
    <header class="hero">
      <p class="eyebrow">Phase 1 Foundation</p>
      <h1>Interactive CPU Pipeline ILP Visualizer</h1>
      <p class="intro">
        Vue + TypeScript scaffold is ready with strict separation between
        simulation core and UI state.
      </p>
    </header>

    <section class="panel">
      <h2>Simulation Boundaries (v1)</h2>
      <ul class="chips">
        <li>5 stages: IF/ID/EX/MEM/WB</li>
        <li>Integer instruction subset</li>
        <li>Educational hazard model</li>
        <li>No backend services</li>
      </ul>
    </section>

    <section class="grid">
      <article class="panel">
        <h2>Pipeline Snapshot</h2>
        <table>
          <thead>
            <tr>
              <th>Stage</th>
              <th>Instruction ID</th>
              <th>Bubble</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in stageRows" :key="row.stage">
              <td>{{ row.stage }}</td>
              <td>{{ row.slot.instructionId ?? "empty" }}</td>
              <td>{{ row.slot.isBubble ? "yes" : "no" }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="panel">
        <h2>Demo Program Seed</h2>
        <ol>
          <li v-for="instruction in demoProgram" :key="instruction.id">
            {{ instruction.rawText }}
          </li>
        </ol>
        <p class="meta">
          Cycle: {{ uiState.machine.cycle }} | PC: {{ uiState.machine.pc }}
        </p>
      </article>
    </section>
  </main>
</template>
