# Engine Guide

Source of truth for API contracts: `src/simulator/engine.ts` (TSDoc on exports).

## What This Module Owns
- Cycle-to-cycle state transitions for the pipeline machine.
- Hazard and forwarding event emission for visualization.
- Completion detection for play/auto-stop controls.

## Public API
- `isMachineComplete(machine)`
  - Returns true only when fetch is exhausted and all pipeline slots are empty.
- `tickMachine(current)`
  - Advances exactly one deterministic cycle and returns a new `MachineState`.

## Runtime Order (Per Tick)
1. Write-back commit.
2. Memory effects (`LW` read / `SW` write + `MemoryDelta`).
3. Execute stage compute (with forwarding inputs when enabled).
4. Hazard analysis in ID.
5. Stall-or-advance transition.
6. Snapshot + metric updates.

## Behavioral Notes
- WB commits happen before hazard checks, so WB values are visible in the same tick.
- Load-use hazards may stall even with forwarding enabled.
- RAW stalls only apply when forwarding is disabled.
- Forwarding events currently represent MEM->EX data usage.

## Related Docs
- Parser contracts: [docs/simulator/parser.md](../simulator/parser.md)
- Shared types: [docs/simulator/types.md](../simulator/types.md)
- UI control flow: [docs/ui/state.md](../ui/state.md)