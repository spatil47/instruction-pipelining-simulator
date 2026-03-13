## Plan: Stop Simulation At Program Completion

Add a completion predicate in simulator logic, then enforce it in UI state so both autoplay and manual stepping stop once no instructions remain to fetch and the pipeline is fully drained.

**Steps**

1. Add an exported completion helper in [src/simulator/engine.ts](src/simulator/engine.ts) that returns true only when:
   - `pc >= program.length`
   - all pipeline stages are empty (`IF/ID/EX/MEM/WB` have `instructionId === null`)
2. Update playback logic in [src/ui/state.ts](src/ui/state.ts#L61):
   - in `startPlay`, return early if already complete
   - after each interval tick, check completion and stop immediately when complete
   - reuse `stopPlay` for interval cleanup/state consistency
3. Update manual stepping in [src/ui/state.ts](src/ui/state.ts#L34):
   - make `stepForward` a no-op if already complete so cycle/history do not grow further
4. Add simulator completion tests in [src/simulator/simulator.test.ts](src/simulator/simulator.test.ts):
   - incomplete while pipeline is still draining
   - complete only after full drain
   - empty program is immediately complete
5. Add UI state tests under `src/ui` to verify:
   - `startPlay` does not start when complete
   - autoplay stops automatically on completion
   - `stepForward` does not advance cycles when complete

**Relevant files**

- [src/simulator/engine.ts](src/simulator/engine.ts) for completion predicate export
- [src/ui/state.ts](src/ui/state.ts) for play/step termination enforcement
- [src/simulator/simulator.test.ts](src/simulator/simulator.test.ts) for completion behavior coverage

**Verification**

1. Run project tests (`npm test`) and confirm all pass.
2. Manually run a 1-2 instruction program in the UI and confirm playback auto-stops after pipeline drain.
3. Confirm timeline/scrollbar no longer grows indefinitely after completion.
4. Confirm reset/apply-program still enables replay from cycle 0.

**Decisions**

- Included: stopping behavior for both autoplay and manual stepping.
- Excluded: any changes to pipeline hazard/forwarding execution semantics.
- Chosen approach: keep completion logic centralized in simulator code and consumed by UI state.
