# MRIO Explorer (Chart Builder MVP) — Architecture, Folder Structure, and Plan

## 1) General architecture (lean + modular)

## Decision snapshot (current)
- **Sparse representation recommendation:** use a **hybrid CSR + CSC** model.
  - Keep **CSR as the primary working format** for row-centric operations (A normalization, row traversal, out-neighbor queries).
  - Keep **CSC as a secondary index** for fast column/in-neighbor access (upstream traversal, some solver/eigen routines).
  - Build both once at ingestion and reuse across chart/query operations.
- **Compute policy:** compute **Leontief and Eigen eagerly** right after ingestion.
  - Default Leontief truncation/order: **20**.
  - Expose a manual precision control so users can increase order when needed.

### Layer A — Data & Domain (`src/data`, `src/engine`)
- **Purpose:** hold canonical dataset structures and MRIO math utilities.
- **Responsibilities:**
  - Dataset contracts (`NodeId`, metadata map, sparse matrix shape info).
  - Ingestion/transformation from raw files into internal sparse representation.
  - Core calculations (A matrix normalization, Leontief-related helpers, eigen-related helpers).
- **Rule:** no UI dependencies.

### Layer B — Query/Interaction Logic (`src/filters`, `src/chart-builder/core`, `src/state`)
- **Purpose:** convert domain data into chart-ready slices and interaction state.
- **Responsibilities:**
  - Text-based filter parsing/evaluation (practical subset, no full SQL).
  - Node neighborhood extraction (upstream/downstream).
  - Selection/hover/focus state transitions.
- **Rule:** chart-agnostic logic goes in `core`; chart-specific adaptation goes in `adapters`.

### Layer C — Rendering & App Orchestration (`src/chart-builder/components`, `src/app`)
- **Purpose:** render charts and wire user actions to state/logic.
- **Responsibilities:**
  - Visual components and interaction handlers.
  - Loading states, error states, basic control panel.
- **Rule:** keep heavy operations out of component render paths.

### Cross-cutting — Background compute (`src/workers`)
- **Purpose:** isolate expensive operations from main thread.
- **Use for:** large matrix transformations, heavy filtering, neighborhood calculations at scale.

---

## 2) Folder structure and ownership

```text
src/
  app/                    # App shell, routing, top-level providers
  data/
    ingest/               # Input adapters/parsers and schema checks
    models/               # Core types/interfaces and shared contracts
    fixtures/             # Sample datasets for manual and smoke checks
  engine/                 # MRIO math and sparse matrix operations
  filters/                # Text filter parser + evaluator
  chart-builder/
    core/                 # Chart-agnostic data shaping and interactions
    adapters/             # Chart-specific data mapping (e.g., sankey/chord)
    components/           # UI components for chart builder
  state/                  # UI/query/interaction state management
  workers/                # Worker entrypoints and worker-safe services
  utils/                  # Lightweight shared utilities

docs/                     # Architecture, roadmap, questions, plans
scripts/                  # Local scripts (import, fixture prep, quick checks)
tests/                    # Lean unit/smoke tests
```

---

## 3) Plan for each folder (what to build first)

### `src/data/models`
- Add baseline interfaces/types for nodes, edges, sparse matrix metadata.
- Define a versioned dataset shape so future data migrations are easier.
- Add `SparseMatrixCSR`, `SparseMatrixCSC`, and a combined `SparseMatrixStore` contract.

### `src/data/ingest`
- Build importer(s) for matrix and metadata map.
- Add minimal validation: dimensions, unique IDs, required fields.
- Construct both CSR and CSC at ingest time and persist them in memory together.

### `src/engine`
- Implement row-normalized A matrix helper.
- Add eager Leontief/eigen compute pipeline with default Leontief degree/order 20.
- Add manual precision override hooks (e.g., order 30/40+) with clear warning in UI for compute cost.
- Keep math utilities pure and testable.

### `src/filters`
- Implement text filter DSL with a small grammar:
  - field:value
  - basic operators (AND, OR, NOT)
  - optional grouping only if needed
- Compile once, evaluate many times.

### `src/chart-builder/core`
- Build chart-ready view model generator.
- Implement neighborhood extraction logic used by click-to-focus.

### `src/chart-builder/adapters`
- Add adapter per chart type; each receives core view model and returns chart-specific shape.

### `src/chart-builder/components`
- Build Chart Builder panel, filter input, chart canvas wrapper, node detail panel.

### `src/state`
- Define state slices: dataset, filters, selection, hover, focus mode, chart config.

### `src/workers`
- Add one worker endpoint with a simple message contract.
- Move eager Leontief/eigen compute and precision recompute tasks to worker first.

### `scripts`
- Add helper scripts for fixture loading and quick checks.

### `tests`
- Add a small set of high-value tests:
  - A matrix row normalization behavior.
  - Filter parse/evaluate behavior.
  - One smoke test for click/focus neighborhood.

---

## 4) Execution plan (incremental)

1. Establish data contracts and ingestion.
2. Implement dual sparse store (CSR + CSC) at ingest.
3. Implement A-matrix + eager Leontief/eigen (degree 20 default) in worker.
4. Ship first chart type and filter MVP.
5. Add click-to-focus neighborhood flow and precision override control.
6. Add second/third chart adapters.
7. Improve performance based on real profiling and real datasets.
