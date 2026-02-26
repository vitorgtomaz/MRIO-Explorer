# Histogram View Specification (MVP First Interactive Chart)

## Purpose
Deliver the first interactive chart in MRIO Explorer as a **value distribution histogram** that is fast, readable, and easy to iterate.

The view should resemble the reference style: compact bars across a quantitative axis, clear scale labels, and optional selection/brush-ready structure for future iterations.

## Scope
### In scope (v1)
- Render histogram of node/edge `value` distribution (configurable source).
- X-axis supports log-like readable scale labels when range is wide.
- Y-axis shows count per bin.
- Click-focus integration with selected bin (filters active dataset slice).
- Worker-backed binning for large datasets.

### Out of scope (v1)
- Full brush/drag interactions.
- Multi-series overlays.
- Persistent saved histogram settings.

## Data contract
- Input:
  - Array of numeric values (`value`) from selected MRIO slice.
  - Optional filter context (sector/region/text filter output).
- Output to renderer:
  - `bins: Array<{ x0: number; x1: number; count: number }>`
  - `stats: { min: number; max: number; total: number; zeros: number }`

## Binning rules
1. Ignore `NaN` and non-finite values with warning count.
2. Keep zeros in a dedicated handling path (zero-bin or first-bin policy, configurable but deterministic).
3. Default bin count: 32 (adjustable by control).
4. If value range spans > 1 order of magnitude, default to log-like x-axis labeling.

## Interaction behavior
- **Primary v1 interaction:** click a bar/bin to set active value range filter.
- Clicking an already-selected bin toggles it off.
- Active bin range is emitted to state and re-applies chart/view-model filters.

## Performance requirements
- Histogram binning must run in worker for large arrays.
- Main thread rendering target: < 16ms for redraw after worker result is available.
- Recompute only when source values/filter context changes.

## Error/empty states
- No values after filtering: show empty-state message, no bars.
- All values invalid/non-finite: show warning and zero valid points.

## Testing (lean)
- Unit: binning output for known small arrays.
- Unit: zero/non-finite handling behavior.
- Smoke: click bin updates active range filter state.

## Implementation notes
- Chart-specific transform logic belongs in `src/chart-builder/`.
- Heavy binning and optional pre-aggregation belong in `src/workers/`.
- UI components orchestrate only.
