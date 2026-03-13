import { ref } from "vue";
import glossary from "./glossary";
import type { GlossaryEntry } from "./glossary";

const activeTerm = ref<string | null>(null);

function setActiveTerm(id: string | null): void {
  activeTerm.value = id;
}

function getEntry(id: string): GlossaryEntry | undefined {
  return glossary[id];
}

export function useGlossary() {
  return { activeTerm, setActiveTerm, getEntry };
}
