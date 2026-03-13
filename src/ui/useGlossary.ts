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

/**
 * Returns shared glossary state and lookup helpers.
 *
 * The composable is backed by module-level refs, so all callers share the same
 * active term selection.
 */
export function useGlossary() {
  return { activeTerm, setActiveTerm, getEntry };
}
