import { afterEach, describe, expect, it, vi } from 'vitest';

import { ingestDataset, ingestDatasetFromNpz, npzCsrArraysFromJson } from '../src/data/ingest/ingestDataset.js';
import type { CsrJsonArrays, DatasetMeta, NpzCsrArrays, RawDatasetInput } from '../src/data/models/types.js';

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

describe('ingestDatasetFromNpz', () => {
  it('ingests metadata + CSR arrays into dataset shape', () => {
    const meta: DatasetMeta = {
      name: 'Toy NPZ',
      version: '1.0',
      rows: 3,
      cols: 3,
      nnz: 3,
      dtype_data: 'float64',
      dtype_indices: 'int32',
      dtype_indptr: 'int32',
      ordering: [
        { code: 'R1_S1', region: 'North', sector: 'Agriculture', value: 101 },
        { code: 'R1_S2', region: 'North', sector: 'Industry', value: 205 },
        { code: 'R2_S1', region: 'South', sector: 'Services', value: 310 },
      ],
      units: 'USD million',
      currency_year: 2020,
      price_basis: 'basic prices',
      build_parameters: {
        columnNormalizationMethod: 'direct output-based',
        zeroTreatment: 'preserve explicit zeros as implicit sparse zeros',
        balancingMethod: 'none',
      },
    };

    const csrArrays: NpzCsrArrays = {
      data: Float64Array.from([0.4, 0.8, 0.2]),
      indices: Int32Array.from([1, 2, 0]),
      indptr: Int32Array.from([0, 1, 2, 3]),
      shape: [3, 3],
    };

    const dataset = ingestDatasetFromNpz(meta, csrArrays);

    expect(dataset.nodeOrder).toEqual(['R1_S1', 'R1_S2', 'R2_S1']);
    expect(dataset.nodeMetaById.get('R1_S1')).toMatchObject({
      region: 'North',
      sector: 'Agriculture',
      value: 101,
    });
    expect(dataset.matrix.csr.values).toEqual(Float64Array.from([0.4, 0.8, 0.2]));
    expect(dataset.matrix.csc.colPtr).toEqual(Uint32Array.from([0, 1, 2, 3]));
  });



  it('converts JSON CSR arrays into typed arrays before ingestion', () => {
    const meta: DatasetMeta = {
      name: 'JSON CSR',
      version: '1.0',
      rows: 3,
      cols: 3,
      nnz: 3,
      dtype_data: 'float32',
      dtype_indices: 'int32',
      dtype_indptr: 'int32',
      ordering: [
        { code: 'A', region: 'North', sector: 'Agriculture', value: 10 },
        { code: 'B', region: 'North', sector: 'Industry', value: 20 },
        { code: 'C', region: 'South', sector: 'Services', value: 30 },
      ],
      units: 'USD million',
      currency_year: 2022,
      price_basis: 'basic prices',
    };

    const payload: CsrJsonArrays = {
      data: [0.4, 0.8, 0.2],
      indices: [1, 2, 0],
      indptr: [0, 1, 2, 3],
      shape: [3, 3],
    };

    const typed = npzCsrArraysFromJson(payload, meta.dtype_data);
    const dataset = ingestDatasetFromNpz(meta, typed);

    expect(typed.data).toBeInstanceOf(Float32Array);
    expect(dataset.matrix.csr.rowPtr).toEqual(Uint32Array.from([0, 1, 2, 3]));
  });

  it('throws when metadata ordering length does not match matrix shape', () => {
    const meta: DatasetMeta = {
      name: 'Invalid Ordering',
      version: '1.0',
      rows: 3,
      cols: 3,
      nnz: 1,
      dtype_data: 'float32',
      dtype_indices: 'int32',
      dtype_indptr: 'int32',
      ordering: [{ code: 'X', region: 'Only', sector: 'One', value: 1 }],
      units: 'USD',
      currency_year: 2021,
      price_basis: 'basic prices',
    };

    const csrArrays: NpzCsrArrays = {
      data: Float32Array.from([0.4]),
      indices: Int32Array.from([1]),
      indptr: Int32Array.from([0, 1, 1, 1]),
      shape: [3, 3],
    };

    expect(() => ingestDatasetFromNpz(meta, csrArrays)).toThrow(
      'Metadata ordering must contain one entry per matrix row/column.',
    );
  });
});
