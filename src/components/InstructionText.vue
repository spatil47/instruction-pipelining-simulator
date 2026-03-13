<script setup lang="ts">
import { computed } from "vue";
import GlossaryTooltip from "./GlossaryTooltip.vue";
import { useGlossary } from "../ui/useGlossary";

const props = defineProps<{ rawText: string }>();

const { getEntry } = useGlossary();

const parsed = computed(() => {
  const text = props.rawText.trim();
  if (!text) return { opcode: "", operands: "", hasEntry: false };
  const spaceIdx = text.search(/\s/);
  if (spaceIdx === -1) {
    // Only opcode, no operands
    return { opcode: text, operands: "", hasEntry: !!getEntry(text) };
  }
  const opcode = text.slice(0, spaceIdx);
  const operands = text.slice(spaceIdx);
  return { opcode, operands, hasEntry: !!getEntry(opcode) };
});
</script>

<template>
  <span class="instruction-text">
    <GlossaryTooltip v-if="parsed.hasEntry" :term="parsed.opcode">
      <span class="instr-opcode">{{ parsed.opcode }}</span>
    </GlossaryTooltip>
    <span v-else class="instr-opcode">{{ parsed.opcode }}</span>
    <span v-if="parsed.operands" class="instr-operands">{{ parsed.operands }}</span>
  </span>
</template>

<style scoped>
.instruction-text {
  display: inline;
}
.instr-opcode {
  font-weight: 700;
}
.instr-operands {
  font-weight: 400;
}
</style>
