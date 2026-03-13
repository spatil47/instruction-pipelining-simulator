<script setup lang="ts">
import { ref, computed } from "vue";
import { useGlossary } from "../ui/useGlossary";

const props = defineProps<{ term: string }>();

const { getEntry, setActiveTerm } = useGlossary();

const entry = computed(() => getEntry(props.term));
const isHovered = ref(false);
const wrapperEl = ref<HTMLElement | null>(null);
const flipBelow = ref(false);

function handleMouseEnter() {
  if (!entry.value) return;
  // Check if flipping is needed: if wrapper is near top of viewport
  if (wrapperEl.value) {
    const rect = wrapperEl.value.getBoundingClientRect();
    flipBelow.value = rect.top < 120;
  }
  isHovered.value = true;
}

function handleMouseLeave() {
  isHovered.value = false;
}

function handleClick(e: MouseEvent) {
  if (!entry.value) return;
  e.stopPropagation();
  setActiveTerm(props.term);
}

const tooltipId = computed(() => `glossary-tip-${props.term}`);
</script>

<template>
  <span
    ref="wrapperEl"
    class="glossary-trigger"
    :class="{ 'has-entry': !!entry }"
    :aria-describedby="entry ? tooltipId : undefined"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <slot />
    <span
      v-if="entry && isHovered"
      :id="tooltipId"
      class="glossary-tooltip-preview"
      :class="{ 'tooltip-below': flipBelow }"
      role="tooltip"
    >
      <strong class="tooltip-term">{{ entry.term }}</strong>
      <span class="tooltip-category">{{ entry.category }}</span>
      <span class="tooltip-preview-text">{{ entry.preview }}</span>
      <span class="tooltip-hint">Click for full details →</span>
    </span>
  </span>
</template>

<style scoped>
.glossary-trigger {
  position: relative;
  display: inline;
}

.glossary-trigger.has-entry {
  cursor: help;
  border-bottom: 1px dotted currentColor;
}

.glossary-tooltip-preview {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 240px;
  background: #1a2e45;
  color: #e8f2ff;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
  pointer-events: none;
  white-space: normal;
}

.glossary-tooltip-preview.tooltip-below {
  bottom: auto;
  top: calc(100% + 6px);
}

.tooltip-term {
  font-size: 0.78rem;
  font-weight: 700;
  color: #7ab3ef;
  line-height: 1.3;
}

.tooltip-category {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #96aabf;
}

.tooltip-preview-text {
  font-size: 0.75rem;
  line-height: 1.5;
  color: #c8ddf5;
}

.tooltip-hint {
  font-size: 0.68rem;
  color: #4d8fcc;
  margin-top: 0.1rem;
}
</style>
