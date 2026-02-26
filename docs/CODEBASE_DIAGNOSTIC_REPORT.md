# MRIO Explorer Codebase Diagnostic Report

Date: 2026-02-20  
Scope: `src/`, `tests/`, and core planning docs.

## Executive summary

The codebase is a strong MVP foundation: modules are small, sparse structures are preserved, and critical math/filter logic is tested. The main risks now are architectural drift (heavy compute still on ingestion path), performance scaling in neighborhood and Leontief routines, and gaps between available engine functionality and user-facing orchestration.

Overall status: **good foundation, medium delivery risk unless next work focuses on integration and scale behaviors**.

---

## What is already working well

1. **Clear module boundaries**
   - Data ingestion, engine math, filters, and chart transformations are separated.
   - This aligns with the intended architecture and lowers future refactor risk.

2. **Sparse-first approach is consistent**
   - Ingestion builds CSR + CSC once and stores both.
   - Core math preserves sparse formats instead of densifying matrices.

3. **Lean, focused test coverage on high-risk logic**
   - Ingestion validation, row normalization, Leontief pipeline, eigen pipeline, filter evaluator, and chart-builder basics all have tests.

4. **Input validation quality is solid for MVP**
   - Version, dimensions, uniqueness, finite values, and parser syntax are checked with explicit error messages.

---

## Priority findings

## P0 — Important before larger datasets/UI rollout

### 1) Heavy compute runs in ingestion path (main-thread risk)
- `ingestDataset` computes eigen eagerly during ingestion.
- This couples IO/parsing with compute latency and can block the UI once wired.
- Recommendation:
  - Move eigen and Leontief compute behind worker contracts.
  - Keep ingestion responsible only for validation + sparse store construction.
  - Return a lightweight `Dataset` first, then hydrate computed fields asynchronously.

### 2) Neighborhood extraction has avoidable O(depth * frontier * links) scans
- `extractNeighborhood` loops through **all links** for each frontier node.
- This is acceptable for small graphs, but costly for larger sparse networks.
- Recommendation:
  - Build adjacency indices (`outByNode`, `inByNode`) once per view model.
  - Neighborhood traversal becomes O(visited nodes + traversed edges).

### 3) Chart node metrics depend on truncated links when `maxLinks` is used
- `buildChartGraphViewModel` computes node degrees/flows **after** optional global link trimming.
- This can misrepresent node importance in side panels and sizing logic.
- Recommendation:
  - Compute canonical node metrics from the full thresholded graph.
  - Apply `maxLinks` only for rendered links (visual payload), not semantic metrics.

## P1 — Important for correctness/operability hardening

### 4) Data sanitization policy is implicit and lossy
- Negative matrix values are dropped with a warning during ingestion.
- This may silently alter economics depending on dataset semantics.
- Recommendation:
  - Make policy explicit (`reject | clamp_zero | keep`) via ingestion options.
  - Default should be explicit in docs and UI upload UX.

### 5) Leontief implementation may scale poorly due to repeated map/sort rebuilds
- Each multiplication/addition stage builds row `Map`s and sorts entries.
- Works for MVP sizes, but will likely be a hotspot for medium-large matrices.
- Recommendation:
  - Add performance budget + profiling benchmark first.
  - Consider sparse-kernel optimizations (pre-indexed row intersections, temporary typed buffers, pruning thresholds).

### 6) Adapter-level link strength normalization is naive
- D3 link strength currently clamps raw values directly into [0.05, 1].
- Wide value distributions can collapse link differentiation.
- Recommendation:
  - Normalize against view-level scale (max, quantile, or log transform) and document behavior.

## P2 — Quality and maintainability improvements

### 7) Tests are noisy (console-heavy)
- Current tests print large debug logs during normal runs.
- Recommendation:
  - Remove or gate debug logs (e.g., `DEBUG_TEST_LOGS` flag) for cleaner CI output.

### 8) Architectural documentation lagged behind implementation details
- Existing docs were directionally correct but did not clearly map current implemented status and gaps.
- Recommendation:
  - Keep a short “Implemented vs Planned” matrix updated every milestone.

---

## Proposed next implementation batch (high confidence)

1. Add worker message contracts for eigen + Leontief jobs.  
2. Refactor ingestion to be compute-free (pure validation + sparse build).  
3. Introduce adjacency indexes in chart-core and optimize neighborhood traversal.  
4. Split “semantic metrics” vs “render budget” behavior in chart view model builder.  
5. Define and implement ingestion sanitization policy options.  
6. Add one benchmark script + one smoke performance check for graph traversal and Leontief.

---

## Suggested acceptance criteria for next batch

- Ingestion returns in bounded time independent of eigen/Leontief complexity.
- Worker compute failures are recoverable and surfaced to UI state.
- Neighborhood extraction scales linearly to traversed edges on sparse graphs.
- Node stats remain stable regardless of `maxLinks` rendering cap.
- Sanitization mode is explicit in API and documented.

---

## Risks if postponed

- UI feels blocked during dataset load on medium inputs.
- Node-level analytics become confusing due to truncated-link side effects.
- Performance regressions become harder to diagnose without baseline profiling.
- Domain trust issues from implicit negative-value handling.
