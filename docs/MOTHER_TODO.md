# Mother TODO — MRIO Explorer Chart Builder MVP

This plan keeps immediate work detailed and execution-oriented, with later phases progressively broader.

## 0. Immediate setup (detailed)
- [ ] Confirm MVP input format(s) for v1 (CSV/JSON decision).
- [x] Freeze core type names (`NodeId`, `NodeMeta`, `SparseMatrixCSR`, `SparseMatrixCSC`, `SparseMatrixStore`).
- [x] Add baseline TypeScript config and lint formatting defaults.
- [ ] Add a tiny synthetic fixture + one medium fixture.
- [x] Lock first interactive chart for implementation: histogram.

## 1. Data and ingestion (detailed)
- [x] Implement metadata map ingestion with uniqueness checks.
- [x] Implement sparse matrix ingestion parser and construct both CSR and CSC formats.
- [x] Validate matrix dimensions and key consistency.
- [x] Build normalized in-memory dataset object.
- [x] Add smoke tests for ingestion success/failure cases.
- [ ] Enforce required metadata fields: `sector`, `region`, `value`.
- [ ] Implement negative-entry policy: `clamp_zero` and emit warning message.
- [ ] Ensure all metadata fields are exposed/discoverable for filtering.

## 2. Core math + stable contracts (detailed)
- [x] Implement row normalization for A matrix.
- [x] Define behavior for zero rows.
- [x] Implement Leontief compute pipeline (default order 20).
- [x] Implement eigen pipeline.
- [x] Add focused tests for core math invariants.
- [ ] Formalize stable contract docs for sparse matrix ops (input/output invariants, error behavior).
- [ ] Add perf guardrails and benchmark for Leontief sparse multiply/add path.

## 3. Workerization (very detailed next batch)

### 3.1 Matrix jobs
- [ ] Define worker contracts for:
  - eigen compute,
  - Leontief compute,
  - precision override recompute.
- [ ] Move heavy matrix operations off main thread.
- [ ] Keep payloads sparse and transfer-friendly.

### 3.2 Graphics-heavy jobs
- [ ] Define worker contract for heavy network-view calculations (large traversal/layout prep).
- [ ] Offload neighborhood extraction for larger graphs when thresholds are exceeded.
- [ ] Keep UI thread for orchestration and rendering only.

### 3.3 Backlog items (deferred)
- [ ] Worker failure recovery policy (retry/timeout/cancel) — move to backlog after click-focus v1.

## 4. Filter MVP hardening (detailed)
- [x] Define compact grammar for text filters.
- [x] Implement tokenizer + parser.
- [x] Compile filter AST to evaluator.
- [x] Add user-facing invalid filter errors.
- [x] Add unit tests for key filter cases.
- [ ] Add metadata-field discovery UX so all metadata keys are visibly filterable.

## 5. Chart roadmap and specs (detailed)
- [x] Chart roadmap order documented: network, sankey (sector→sector and region→region), spy (L view), histogram, circular packing, chord.
- [x] Add histogram specification document.
- [x] Add network view specification document (depth `n=5`, click-focus recenter).
- [ ] Reconcile roadmap ordering with first implementation priority (histogram first, then network).

## 6. First interactive chart delivery — histogram (very detailed)
- [ ] Implement histogram adapter + renderer.
- [ ] Add worker-backed binning path for larger datasets.
- [ ] Implement click-to-select-bin focus behavior.
- [ ] Connect selected bin range to filtering/state pipeline.
- [ ] Add lean tests for binning correctness + click behavior.

## 7. Network view delivery — click-focus v1 (very detailed)
- [ ] Implement depth-based neighborhood extraction with default `n=5` from random seed node.
- [ ] Build adjacency index (`outByNode`, `inByNode`) to avoid repeated full-link scans.
- [ ] Implement click on node => rebuild chart centered on clicked node.
- [ ] Keep hover detail behavior specified (sector, region, value) but not required for strict v1 scope.
- [ ] Add scalability smoke test for sparse graph traversal.

## 8. UX and state (detailed)
- [ ] Improve loading and empty states.
- [ ] Add compute-progress messaging and precision-cost hints.
- [ ] Keep persistence between sessions in backlog until click-focus v1 stabilizes.

## 9. Additional chart support (semi-detailed)
- [ ] Implement sankey (sector→sector).
- [ ] Implement sankey (region→region).
- [ ] Implement spy view for Leontief matrix visualization.
- [ ] Implement circular packing.
- [ ] Implement chord diagram.

## 10. Reliability and maintainability (semi-detailed)
- [ ] Keep modules small and replaceable.
- [ ] Refactor gradually when pain points appear.
- [ ] Expand tests only where defects are recurring.
- [ ] Reduce test log noise for cleaner CI output.
