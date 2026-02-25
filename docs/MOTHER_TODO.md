# Mother TODO — MRIO Explorer Chart Builder MVP

This plan is intentionally detailed at the top and increasingly general lower down.

## 0. Immediate setup (detailed)
- [ ] Confirm MVP scope for first chart type.
- [ ] Confirm accepted input format(s) for v1.
- [x] Freeze core type names (`NodeId`, `NodeMeta`, `SparseMatrixCSR`, `SparseMatrixCSC`, `SparseMatrixStore`).
- [x] Add baseline TypeScript config and lint formatting defaults.
- [ ] Add a tiny synthetic fixture + one medium fixture.

## 1. Data and ingestion (detailed)
- [x] Implement metadata map ingestion with uniqueness checks.
- [x] Implement sparse matrix ingestion parser and construct both CSR and CSC formats.
- [x] Validate matrix dimensions and key consistency.
- [x] Build a normalized in-memory dataset object.
- [x] Add one smoke test for ingestion success/failure cases.

## 2. Core math (detailed)
- [x] Implement row normalization for A matrix.
- [x] Define behavior for zero rows.
- [x] Implement eager Leontief compute pipeline with default degree/order 20.
- [x] Implement eager eigen pipeline at dataset load.
- [x] Add focused tests for A matrix invariants.

## 3. Filter MVP (detailed)
- [x] Define compact grammar for text filters.
- [x] Implement tokenizer + parser.
- [x] Compile filter AST to evaluator.
- [x] Add user-facing invalid filter errors.
- [x] Add unit tests for key filter cases.

## 4. Chart builder core + first chart (detailed)
- [x] Implement chart-agnostic view model creator.
- [x] Implement node click-to-focus neighborhood extraction.
- [x] Build first chart adapter (D3 force-directed graph).
- [ ] Wire hover/click/select interactions.
- [ ] Add simple side panel for selected node details.

## 5. Off-main-thread compute (semi-detailed)
- [ ] Introduce worker API message contracts.
- [ ] Move eager Leontief/eigen computation to worker.
- [ ] Add manual precision override job (recompute Leontief with higher order).
- [ ] Ensure serialization/transfer strategy is efficient.
- [ ] Add basic error/retry handling for worker tasks.

## 6. UX hardening (semi-detailed)
- [ ] Improve loading and empty states.
- [ ] Add interaction hints and lightweight docs in UI.
- [ ] Improve defaults for filtering and chart configuration.
- [ ] Add minimal persistence for user settings if useful.

## 7. Additional chart support (general)
- [ ] Add chord diagram adapter.
- [ ] Add heatmap adapter.
- [ ] Add dendrogram adapter.
- [ ] Add geographic map adapter.
- [ ] Reuse core view model and interaction primitives.
- [ ] Keep chart-specific logic isolated.

## 8. App shell and UI components (general)
- [ ] Build app shell with routing and top-level state providers (`src/app/`).
- [ ] Build Chart Builder panel (chart type selector, filter input, canvas wrapper).
- [ ] Build node detail side panel (shown on click/select).
- [ ] Build filter input widget with inline syntax error display.
- [ ] Implement state slices: dataset, filters, selection, hover, focus, chart config (`src/state/`).

## 9. Data loading UI (general)
- [ ] File upload input for JSON datasets.
- [ ] CSV import adapter and parser.
- [ ] In-browser validation feedback during upload.
- [ ] Add sample fixture datasets (`src/data/fixtures/`).

## 10. Performance improvements (general)
- [ ] Profile real datasets and identify hot paths.
- [ ] Optimize only measured bottlenecks.
- [ ] Introduce incremental rendering and thresholds as needed.

## 11. Reliability and maintainability (general)
- [ ] Keep modules small and replaceable.
- [ ] Refactor gradually when pain points appear.
- [ ] Expand tests only where defects are recurring.

## 12. Future evolution (high-level)
- [ ] Evaluate WASM acceleration only if JS+worker path becomes limiting.
- [ ] Consider collaborative features and saved analysis sessions.
- [ ] Consider larger ecosystem integration once MVP is stable.
