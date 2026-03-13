<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useGlossary } from "../ui/useGlossary";

const { activeTerm, setActiveTerm, getEntry } = useGlossary();

const entry = computed(() =>
  activeTerm.value ? getEntry(activeTerm.value) : null,
);
const isOpen = computed(() => !!entry.value);

function close() {
  setActiveTerm(null);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <Transition name="panel-slide">
    <aside
      v-if="isOpen && entry"
      class="glossary-panel"
      role="complementary"
      aria-label="Glossary"
    >
      <div class="panel-header">
        <div class="panel-title-area">
          <span class="panel-term">{{ entry.term }}</span>
          <span class="panel-category-badge">{{ entry.category }}</span>
        </div>
        <button
          class="panel-close"
          aria-label="Close glossary panel"
          @click="close"
        >
          ✕
        </button>
      </div>

      <div class="panel-body">
        <section class="panel-section">
          <h3 class="panel-section-title">Definition</h3>
          <p class="panel-definition">{{ entry.definition }}</p>
        </section>

        <section v-if="entry.syntax" class="panel-section">
          <h3 class="panel-section-title">Syntax</h3>
          <pre class="panel-syntax">{{ entry.syntax }}</pre>
        </section>

        <section v-if="entry.example" class="panel-section">
          <h3 class="panel-section-title">Example</h3>
          <pre class="panel-example">{{ entry.example }}</pre>
        </section>

        <section v-if="entry.diagram" class="panel-section">
          <h3 class="panel-section-title">Diagram</h3>
          <pre class="panel-diagram">{{ entry.diagram }}</pre>
        </section>

        <section
          v-if="entry.relatedTerms && entry.relatedTerms.length > 0"
          class="panel-section"
        >
          <h3 class="panel-section-title">Related Terms</h3>
          <div class="panel-related">
            <button
              v-for="rel in entry.relatedTerms"
              :key="rel"
              class="related-chip"
              @click="setActiveTerm(rel)"
            >
              {{ getEntry(rel)?.term ?? rel }}
            </button>
          </div>
        </section>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.glossary-panel {
  position: fixed;
  right: 0;
  top: 80px;
  width: 320px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  background: #fff;
  border: 1px solid #dde6f0;
  border-right: none;
  border-radius: 12px 0 0 12px;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  z-index: 500;
  display: flex;
  flex-direction: column;
}

/* Slide-in/out animation */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.22s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
}
.panel-slide-enter-to,
.panel-slide-leave-from {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.85rem 1rem 0.6rem;
  border-bottom: 1px solid #dde6f0;
  gap: 0.5rem;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.panel-title-area {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.panel-term {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0c223f;
  line-height: 1.3;
  word-break: break-word;
}

.panel-category-badge {
  display: inline-block;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #eef4fb;
  color: #1a4a82;
  border-radius: 4px;
  padding: 0.1rem 0.45rem;
  width: fit-content;
}

.panel-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #55708a;
  font-size: 1rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  line-height: 1;
}
.panel-close:hover {
  background: #eef4fb;
  color: #0c223f;
}

.panel-body {
  padding: 0.75rem 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.panel-section-title {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #3b5275;
}

.panel-definition {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.65;
  color: #1a2e45;
}

.panel-syntax,
.panel-example {
  margin: 0;
  font-family: "JetBrains Mono", "Fira Mono", "Consolas", monospace;
  font-size: 0.76rem;
  background: #f4f7fa;
  border: 1px solid #dde6f0;
  border-radius: 6px;
  padding: 0.5rem 0.65rem;
  white-space: pre-wrap;
  color: #1a2e45;
  line-height: 1.6;
}

.panel-diagram {
  margin: 0;
  font-family: "JetBrains Mono", "Fira Mono", "Consolas", monospace;
  font-size: 0.72rem;
  background: #0c223f;
  color: #a8cbf5;
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  white-space: pre;
  overflow-x: auto;
  line-height: 1.6;
}

.panel-related {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.related-chip {
  background: #eef4fb;
  color: #1a4a82;
  border: 1px solid #c0d8f0;
  border-radius: 20px;
  padding: 0.2rem 0.65rem;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.related-chip:hover {
  background: #d9e8f8;
}
</style>
