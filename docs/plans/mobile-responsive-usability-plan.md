# Mobile Responsiveness And Usability Plan

## Goal

Make the simulator feel intentionally designed and easy to use on phones and tablets, without regressing desktop clarity or simulation correctness.

## Success Criteria

- Core actions (Play/Pause, Step, Reset, Apply, scrub timeline) are reachable and usable with one hand on a phone.
- No horizontal page overflow at common mobile widths (320px, 360px, 390px, 414px).
- Text remains legible without pinch-zoom (minimum practical body size and sufficient contrast).
- Pipeline, waterfall, editor, metrics, register file, and event log each have a mobile-optimized presentation.
- Keyboard and screen-reader interactions remain functional and predictable.
- Performance remains smooth during playback on mid-range mobile devices.

## Current State Snapshot

- Existing breakpoints at 900px and 600px are a good start, but some sections still compress instead of reflowing for touch ergonomics.
- Controls, toggles, stage boxes, and dense table content become crowded on narrow screens.
- The waterfall table can overflow and needs clearer mobile interaction affordances.

## Implementation Plan

### Phase 1: Responsive Foundations

1. Define a breakpoint system and spacing scale.
2. Introduce responsive type and tap-target sizing tokens.
3. Establish max line lengths and panel padding rules per breakpoint.

Deliverables:

- CSS custom properties for spacing, type scale, radii, and touch targets.
- Breakpoint map (example: 480, 768, 1024) documented in comments or README notes.

### Phase 2: Layout Reflow By Section

1. Header:
- Stack title/meta cleanly on small screens.
- Keep cycle badge visible without wrapping into awkward rows.

2. Controls bar:
- Move to a 2-row mobile layout:
  - Row 1: Reset, Step, Play/Pause.
  - Row 2: Speed and hazard toggles.
- Increase button hit area to at least 40-44px height.

3. Pipeline stages:
- Switch from tight horizontal packing to a scrollable lane or wrapped card grid optimized for narrow viewports.
- Ensure stage names and instruction text remain readable at 320px width.

4. Main grid:
- Keep single-column below tablet width, but reorder panels for mobile task flow:
  - Controls and current state first.
  - Program editor and Apply action next.
  - Waterfall and diagnostics afterward.

5. Timeline scrubber:
- Increase slider touch area and ensure labels do not overlap.
- Keep LIVE control tappable and visually stateful.

### Phase 3: Dense Data Components

1. Waterfall table:
- Keep horizontal scroll, but improve mobile readability with sticky instruction column and larger tap/hover equivalent target.
- Add clear visual cue that the table is scrollable horizontally.

2. Program editor:
- Increase default mobile rows and line-height for easier editing.
- Ensure parse errors are readable and not clipped.

3. Metrics and legend:
- Convert metrics to compact cards on small screens.
- Prevent legend labels from crowding; allow clean wrapping.

4. Register file and event log:
- Improve chip spacing for thumb scrolling.
- Increase event log text size slightly on phones while preserving density.

### Phase 4: Usability And Accessibility Hardening

1. Add visible focus states for keyboard users across controls and table elements.
2. Verify contrast ratios for badges, tags, and status states (forward, stall, bubble).
3. Add ARIA labels where icon-only controls appear.
4. Respect reduced-motion preferences for animated interactions.
5. Validate semantic heading order and landmarks for assistive tech.

### Phase 5: Performance And Quality Gates

1. Test runtime smoothness while playing simulation on mobile emulation.
2. Limit expensive layout thrashing in large tables.
3. Add/adjust tests where practical:
- UI state tests for mobile-specific behavior (if logic-driven).
- Visual/manual QA checklist for layout and interaction.

## QA Matrix

Screen widths:

- 320x568
- 360x800
- 390x844
- 768x1024
- 1024x1366

Browsers/devices:

- iOS Safari
- Chrome Android
- Desktop Chrome responsive emulator

Manual test checklist:

1. Reach and trigger all core controls with touch.
2. Confirm no clipped text in header, controls, tags, and legend.
3. Verify waterfall usability with horizontal scroll and selected-cycle clarity.
4. Edit and apply program text without accidental taps.
5. Validate event log readability and scroll behavior.
6. Run keyboard-only navigation and confirm focus visibility.
7. Check color contrast for status indicators.

## Rollout Sequence

1. Implement foundational tokens and breakpoints.
2. Reflow controls/header/stages.
3. Rework dense components (waterfall/editor/metrics/log).
4. Run accessibility and cross-device QA.
5. Polish and ship.

## Definition Of Done

- Layout is stable, readable, and touch-friendly across target mobile widths.
- No major usability friction found in checklist testing.
- Desktop experience remains intact.
- Any added behavior is covered by tests or documented manual QA evidence.