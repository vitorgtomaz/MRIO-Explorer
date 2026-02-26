# MRIO Explorer — Architecture, Folder Ownership, and Implementation Plan

## Mission alignment

Architecture is optimized for a fast browser MVP:
- Keep sparse/domain logic isolated and stable.
- Keep chart-specific logic modular via adapters.
- Offload heavy matrix and heavy graphics calculations to workers.
- Keep UI as orchestrator, not compute owner.

---

## 1) Current architecture snapshot

## Layer A — Data + Domain (`src/data`, `src/engine`)
**Implemented now**
- Dataset contracts and sparse matrix types.
- Ingestion with validation + CSR/CSC construction.
- Row normalization, Leontief series, dominant eigenpair.

**Gap to close next**
- Enforce required metadata fields (`sector`, `region`, `value`).
- Implement explicit negative-entry policy (`clamp_zero` + warning).
- Document stable sparse matrix operation contracts.

## Layer B — Query + Interaction Logic (`src/filters`, `src/chart-builder/core`, `src/state`)
**Implemented now**
- Text filter parser/evaluator.
- Chart view model generation.
- Neighborhood extraction baseline.

**Gap to close next**
- Ensure all metadata fields are discoverable/filterable.
- Optimize neighborhood traversal with adjacency indexing.
- Add click-focus state flow for histogram and network.

## Layer C — Rendering + App orchestration (`src/chart-builder/components`, `src/app`)
**Implemented now**
- D3 force adapter data mapping.

**Gap to close next**
- Ship histogram as first interactive chart.
- Ship network click-focus (`n=5`) behavior.
- Add clear loading and empty states.

## Cross-cutting — Background compute (`src/workers`)
**Implemented now**
- Folder placeholder only.

**Gap to close next**
- Worker contracts for eigen/Leontief/precision override.
- Worker contracts for heavier network graph calculations.

---

## 2) Folder ownership and rules

```text
src/
  app/                    App shell and orchestration only
  data/
    ingest/               Parse + validate + sparse build
    models/               Shared contracts/types
    fixtures/             Small representative datasets
  engine/                 Pure sparse/matrix operations (stable contracts)
  filters/                Text filter tokenizer/parser/evaluator
  chart-builder/
    core/                 Chart-agnostic graph/interaction logic
    adapters/             Chart-specific data shaping
    components/           UI rendering components
  state/                  Dataset/filter/interaction/worker status state
  workers/                Worker entrypoints + heavy compute handlers
  utils/                  Lightweight shared helpers
```

### Non-negotiable boundaries
- `src/engine/`: matrix/domain logic only.
- `src/chart-builder/`: chart-specific transformation logic only.
- `src/filters/`: text filter parsing/evaluation only.
- `src/state/`: state transitions and orchestration state only.
- `src/workers/`: long-running/heavy computations (matrix + heavy graphics prep).
- UI components orchestrate and render; they do not own heavy computation.

---

## 3) Chart roadmap

Planned chart set:
1. Network chart
2. Sankey (sector→sector)
3. Sankey (region→region)
4. Spy plot (Leontief visualization)
5. Histogram (value distribution)
6. Circular packing
7. Chord diagram

Implementation priority for first interactive delivery: **histogram first**, then network click-focus.

---

## 4) Incremental execution plan

1. Finalize ingestion metadata/negative-value policies.
2. Define stable sparse-op contract docs.
3. Introduce worker contracts and migrate heavy matrix operations.
4. Add worker path for heavy network calculations.
5. Deliver histogram v1 interaction.
6. Deliver network click-focus (`n=5`) behavior.

---

## 5) Definition of done for this phase

- Ingestion behavior is explicit for metadata requirements and negative values.
- Heavy matrix and heavier graphics calculations are worker-capable.
- Histogram click interaction is functional.
- Network view recenters on click with depth `n=5` traversal.
- Sparse matrix operation contracts are documented as stable.
