# MRIO Explorer

MRIO Explorer is a browser-first MVP for exploring multi-regional input-output (MRIO) datasets with sparse-matrix math, text filters, and chart-ready graph transformations.

## Current project status

This repository currently provides:
- typed dataset ingestion into dual sparse formats (CSR + CSC),
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
```

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
