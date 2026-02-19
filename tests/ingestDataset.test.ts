import { afterEach, describe, expect, it, vi } from 'vitest';

import { ingestDataset } from '../src/data/ingest/ingestDataset.js';
import type { RawDatasetInput } from '../src/data/models/types.js';

const baseInput: RawDatasetInput = {
  version: '1.0',
  nodes: [
    { id: 'A', label: 'Agriculture' },
    { id: 'B', label: 'Manufacturing' },
    { id: 'C', label: 'Services' },
  ],
  matrix: {
    rows: 3,
    cols: 3,
    entries: [
      { row: 0, col: 1, value: 0.4 },
      { row: 1, col: 2, value: 0.8 },
      { row: 2, col: 0, value: 0.2 },
    ],
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ingestDataset', () => {
  it('builds both CSR and CSC sparse matrix stores', () => {
    console.log('[ingestDataset] Starting: builds both CSR and CSC sparse matrix stores');
    const dataset = ingestDataset(baseInput);
    console.log('[ingestDataset] nodeOrder:', dataset.nodeOrder);
    console.log('[ingestDataset] CSR:', {
      rowPtr: Array.from(dataset.matrix.csr.rowPtr),
      colIdx: Array.from(dataset.matrix.csr.colIdx),
      values: Array.from(dataset.matrix.csr.values),
    });
    console.log('[ingestDataset] CSC:', {
      colPtr: Array.from(dataset.matrix.csc.colPtr),
      rowIdx: Array.from(dataset.matrix.csc.rowIdx),
      values: Array.from(dataset.matrix.csc.values),
    });
    console.log('[ingestDataset] Eigen:', {
      converged: dataset.eigen.converged,
      value: dataset.eigen.value,
      iterations: dataset.eigen.iterations,
    });

    expect(dataset.nodeOrder).toEqual(['A', 'B', 'C']);
    expect(dataset.matrix.csr.rowPtr).toEqual(Uint32Array.from([0, 1, 2, 3]));
    expect(dataset.matrix.csr.colIdx).toEqual(Uint32Array.from([1, 2, 0]));

    expect(dataset.matrix.csc.colPtr).toEqual(Uint32Array.from([0, 1, 2, 3]));
    expect(dataset.matrix.csc.rowIdx).toEqual(Uint32Array.from([2, 0, 1]));
    expect(dataset.eigen.converged).toBe(true);
    expect(dataset.eigen.value).toBeCloseTo(1, 6);
  });

  it('throws when duplicate matrix coordinates are present', () => {
    console.log('[ingestDataset] Starting: throws when duplicate matrix coordinates are present');
    const input: RawDatasetInput = {
      ...baseInput,
      matrix: {
        rows: 3,
        cols: 3,
        entries: [
          { row: 0, col: 1, value: 1 },
          { row: 0, col: 1, value: 0.5 },
          { row: 2, col: 0, value: 0.2 },
        ],
      },
    };

    expect(() => ingestDataset(input)).toThrow('Duplicate matrix coordinate detected: (0, 1)');
  });

  it('warns and removes negative entries from sparse store', () => {
    console.log('[ingestDataset] Starting: warns and removes negative entries from sparse store');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const input: RawDatasetInput = {
      ...baseInput,
      matrix: {
        rows: 3,
        cols: 3,
        entries: [
          { row: 0, col: 1, value: -1 },
          { row: 1, col: 2, value: 0.8 },
          { row: 2, col: 0, value: 0.2 },
        ],
      },
    };

    const dataset = ingestDataset(input);
    console.log('[ingestDataset] Warning scenario CSR:', {
      rowPtr: Array.from(dataset.matrix.csr.rowPtr),
      colIdx: Array.from(dataset.matrix.csr.colIdx),
      values: Array.from(dataset.matrix.csr.values),
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(dataset.matrix.csr.rowPtr).toEqual(Uint32Array.from([0, 0, 1, 2]));
    expect(dataset.matrix.csr.colIdx).toEqual(Uint32Array.from([2, 0]));
    expect(dataset.matrix.csr.values).toEqual(Float64Array.from([0.8, 0.2]));
  });

  it('throws for duplicate node ids', () => {
    console.log('[ingestDataset] Starting: throws for duplicate node ids');
    const input: RawDatasetInput = {
      ...baseInput,
      nodes: [
        { id: 'A', label: 'Agriculture' },
        { id: 'A', label: 'Duplicate' },
        { id: 'C', label: 'Services' },
      ],
    };

    expect(() => ingestDataset(input)).toThrow('Duplicate node id detected: A');
  });

  it('throws for dimension mismatches', () => {
    console.log('[ingestDataset] Starting: throws for dimension mismatches');
    const input: RawDatasetInput = {
      ...baseInput,
      matrix: {
        ...baseInput.matrix,
        rows: 2,
      },
    };

    expect(() => ingestDataset(input)).toThrow('Matrix shape must match node count.');
  });

  it('throws for unsupported dataset versions', () => {
    console.log('[ingestDataset] Starting: throws for unsupported dataset versions');
    const input = {
      ...baseInput,
      version: '2.0',
    } as unknown as RawDatasetInput;

    expect(() => ingestDataset(input)).toThrow('Unsupported dataset version: 2.0');
  });
});
