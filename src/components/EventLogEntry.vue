<script setup lang="ts">
import { computed } from "vue";
import GlossaryTooltip from "./GlossaryTooltip.vue";

const props = defineProps<{
  ev: { cycle: number; kind: "hazard" | "forward"; text: string };
}>();

// Parse the event text into structured parts so we avoid v-html.
// Event text formats:
//   "C3 [RAW] some description"
//   "C3 [LOAD_USE] some description"
//   "C3 [FWD] EX→MEM R1=5"
const parts = computed(() => {
  const text = props.ev.text;
  const tagMatch = text.match(/^(C\d+\s)\[([^\]]+)\](.*)$/);
  if (!tagMatch) return [{ type: "plain" as const, text }];

  const prefix = tagMatch[1];   // e.g. "C3 "
  const tag = tagMatch[2];      // e.g. "RAW" | "LOAD_USE" | "FWD"
  const rest = tagMatch[3];     // remainder of the message

  // Map tag to glossary key
  const glossaryKey: Record<string, string> = {
    RAW: "RAW",
    LOAD_USE: "LOAD_USE",
    FWD: "forwarding",
  };

  const key = glossaryKey[tag];

  return [
    { type: "plain" as const, text: prefix },
    { type: "tag" as const, tag, glossaryKey: key ?? null },
    { type: "plain" as const, text: rest },
  ];
});
</script>

<template>
  <li :class="ev.kind === 'forward' ? 'ev-forward' : 'ev-hazard'">
    <template v-for="(part, i) in parts" :key="i">
      <span v-if="part.type === 'plain'">{{ part.text }}</span>
      <GlossaryTooltip
        v-else-if="part.type === 'tag' && part.glossaryKey"
        :term="part.glossaryKey"
      >
        <span class="ev-tag">[{{ part.tag }}]</span>
      </GlossaryTooltip>
      <span v-else class="ev-tag">[{{ part.tag }}]</span>
    </template>
  </li>
</template>

<style scoped>
li {
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
.ev-tag {
  font-weight: 700;
}
</style>
