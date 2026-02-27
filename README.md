# MRIO Explorer

MRIO Explorer is a browser-first MVP for exploring multi-regional input-output (MRIO) datasets with sparse-matrix math, text filters, and chart-ready graph transformations.

## Current project status

This repository currently provides:
- typed dataset ingestion into dual sparse formats (CSR + CSC),
- NPZ+JSON ingestion for production-style sparse MRIO datasets,
- core MRIO math utilities (row normalization, truncated Leontief series, dominant eigenpair),
- text filter parsing + evaluation for node metadata,
- chart-builder core transformations (graph view model and neighborhood extraction),
- a D3 force adapter and focused unit/smoke tests.

The app shell and interactive UI wiring are still in-progress.

## Repository map

```text
src/
  data/           Dataset types + ingestion
  engine/         Sparse math and MRIO computations
  filters/        Text filter parser + evaluator
  chart-builder/  Chart-ready transformations and adapters
  state/          State layer (planned expansion)
  workers/        Off-main-thread compute (planned expansion)
  app/            App orchestration (planned expansion)

docs/
  MOTHER_TODO.md
  ARCHITECTURE_AND_FOLDER_PLAN.md
  KEY_DESIGN_QUESTIONS.md
  CODEBASE_DIAGNOSTIC_REPORT.md

datasets/
  toy_20x20_linear/
  toy_20x20_block/

  scripts/
  exportToyNpzFromJson.py
```

## Dataset ingestion format (recommended)

For matrix ingestion, use:
- `A_csr.npz` for CSR arrays,
- `A_meta.json` for schema + provenance.

### `A_csr.npz` keys

Store the matrix in CSR form with these arrays:
- `data` (`float32` or `float64`),
- `indices` (`int32`),
- `indptr` (`int32` or `int64`),
- `shape` (`[rows, cols]`, optional if present in metadata).

### `A_meta.json` fields

Expected metadata fields:
- `name`, `version`,
- `rows`, `cols`, `nnz`,
- `dtype_data`, `dtype_indices`, `dtype_indptr`,
- `ordering` (one item per row/col with `code`, `region`, `sector`, and `value`),
- `units`, `currency_year`, `price_basis`,
- `checksum` (optional),
- `build_parameters` (optional: normalization, zero handling, balancing details).

### Ingestion API

Use `ingestDatasetFromNpz(meta, csrArrays)` from `src/data/ingest/ingestDataset.ts` to validate and ingest metadata + CSR arrays into the in-memory dataset model.

If you store CSR arrays as JSON lists in Git, convert first with `npzCsrArraysFromJson(payload, meta.dtype_data)`.

The ingestor validates shape, pointer monotonicity, `nnz`, dtypes (as declared in metadata), and ordering cardinality before constructing CSR + CSC stores and computing the dominant eigenpair.

## Included toy datasets

Two toy datasets are included for smoke testing and integration:
- `datasets/toy_20x20_linear/` (20x20 with near-banded inter-sector links),
- `datasets/toy_20x20_block/` (20x20 with two stronger regional blocks).

Each dataset includes `A_csr.json` and `A_meta.json` (text-only so they can be pushed to GitHub), and metadata contains sector name, region name, and value per row/column ordering item.



### If GitHub blocks `.npz` binaries

Use the committed text format (`A_csr.json`) in Git, then generate `.npz` locally when needed:

```bash
pip install numpy
python scripts/exportToyNpzFromJson.py
```

This writes `A_csr.npz` next to each toy dataset. For larger real datasets, use GitHub Releases or object storage (S3/GCS) for hosting binaries and keep only metadata/checksums in Git.

## Quick start

### Install

```bash
npm install
```

### Run checks

```bash
npm test
npm run typecheck
```

## Minimal calculator page

Open `mrio_calculator.html` in a browser for a lightweight standalone page where you can:
- enter up to a 10x10 MRIO flow matrix,
- compute row-normalized coefficients,
- compute a truncated Leontief series,
- compute the dominant eigenvalue/eigenvector via power iteration.

## Documentation

- Architecture and folder ownership: `docs/ARCHITECTURE_AND_FOLDER_PLAN.md`
- Decision backlog: `docs/KEY_DESIGN_QUESTIONS.md`
- Execution plan: `docs/MOTHER_TODO.md`
- Deep diagnostic + remediation plan: `docs/CODEBASE_DIAGNOSTIC_REPORT.md`
- Histogram view specification: `docs/HISTOGRAM_VIEW_SPEC.md`
- Network view specification: `docs/NETWORK_VIEW_SPEC.md`
