# Glossary Guide

Source of truth for API contracts:
- `src/ui/glossary.ts`
- `src/ui/useGlossary.ts`

## What These Modules Own
- Glossary entry schema and canonical glossary dataset.
- Shared composable state for active term selection and lookups.

## Public API Summary
- `GlossaryEntry` interface (`src/ui/glossary.ts`)
- default glossary export (`src/ui/glossary.ts`)
- `useGlossary()` (`src/ui/useGlossary.ts`)

## Behavioral Notes
- `useGlossary` is module-singleton state; all consumers share the same active term.
- Unknown glossary keys should be treated as missing and guarded in components.
- Glossary data should remain keyed by stable IDs used in UI markup.

## Related Docs
- UI state orchestration: [docs/ui/state.md](../ui/state.md)
- Component integration details: [docs/components/components-reference.md](../components/components-reference.md)