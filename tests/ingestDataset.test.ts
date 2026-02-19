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
    const dataset = ingestDataset(baseInput);

    expect(dataset.nodeOrder).toEqual(['A', 'B', 'C']);
    expect(dataset.matrix.csr.rowPtr).toEqual(Uint32Array.from([0, 1, 2, 3]));
    expect(dataset.matrix.csr.colIdx).toEqual(Uint32Array.from([1, 2, 0]));

    expect(dataset.matrix.csc.colPtr).toEqual(Uint32Array.from([0, 1, 2, 3]));
    expect(dataset.matrix.csc.rowIdx).toEqual(Uint32Array.from([2, 0, 1]));
    expect(dataset.eigen.converged).toBe(true);
    expect(dataset.eigen.value).toBeCloseTo(1, 6);
  });

  it('throws when duplicate matrix coordinates are present', () => {
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

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(dataset.matrix.csr.rowPtr).toEqual(Uint32Array.from([0, 0, 1, 2]));
    expect(dataset.matrix.csr.colIdx).toEqual(Uint32Array.from([2, 0]));
    expect(dataset.matrix.csr.values).toEqual(Float64Array.from([0.8, 0.2]));
  });

  it('throws for duplicate node ids', () => {
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
    const input = {
      ...baseInput,
      version: '2.0',
    } as unknown as RawDatasetInput;

    expect(() => ingestDataset(input)).toThrow('Unsupported dataset version: 2.0');
  });
});
