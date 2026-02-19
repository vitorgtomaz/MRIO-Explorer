import { describe, expect, it } from 'vitest';

import {
  computeLeontiefFromFlowMatrix,
  computeLeontiefSeries,
} from '../src/engine/leontief.js';
import type { SparseMatrixCSR } from '../src/data/models/types.js';

function matrixToDense(csr: SparseMatrixCSR): number[][] {
  const dense = Array.from({ length: csr.rows }, () => Array.from({ length: csr.cols }, () => 0));

  for (let row = 0; row < csr.rows; row += 1) {
    for (let idx = csr.rowPtr[row]; idx < csr.rowPtr[row + 1]; idx += 1) {
      dense[row][csr.colIdx[idx]] = csr.values[idx];
    }
  }

  return dense;
}

describe('computeLeontiefSeries', () => {
  it('computes I + A + A^2 for a small sparse matrix', () => {
    console.log('[computeLeontiefSeries] Starting: computes I + A + A^2 for a small sparse matrix');
    const normalizedA: SparseMatrixCSR = {
      rows: 2,
      cols: 2,
      rowPtr: Uint32Array.from([0, 1, 2]),
      colIdx: Uint32Array.from([1, 0]),
      values: Float64Array.from([0.5, 0.25]),
    };

    const result = computeLeontiefSeries(normalizedA, { order: 2 });
    const dense = matrixToDense(result.matrix);
    console.log('[computeLeontiefSeries] Result order:', result.order);
    console.log('[computeLeontiefSeries] Dense matrix:', dense);

    expect(result.order).toBe(2);
    expect(dense[0][0]).toBeCloseTo(1.125);
    expect(dense[0][1]).toBeCloseTo(0.5);
    expect(dense[1][0]).toBeCloseTo(0.25);
    expect(dense[1][1]).toBeCloseTo(1.125);
  });

  it('returns identity for order 0', () => {
    console.log('[computeLeontiefSeries] Starting: returns identity for order 0');
    const normalizedA: SparseMatrixCSR = {
      rows: 2,
      cols: 2,
      rowPtr: Uint32Array.from([0, 1, 1]),
      colIdx: Uint32Array.from([1]),
      values: Float64Array.from([0.5]),
    };

    const result = computeLeontiefSeries(normalizedA, { order: 0 });
    console.log('[computeLeontiefSeries] Identity result rowPtr:', Array.from(result.matrix.rowPtr));
    console.log('[computeLeontiefSeries] Identity result colIdx:', Array.from(result.matrix.colIdx));
    console.log('[computeLeontiefSeries] Identity result values:', Array.from(result.matrix.values));
    expect(result.matrix.rowPtr).toEqual(Uint32Array.from([0, 1, 2]));
    expect(result.matrix.colIdx).toEqual(Uint32Array.from([0, 1]));
    expect(result.matrix.values).toEqual(Float64Array.from([1, 1]));
  });

  it('normalizes rows when using flow matrix convenience pipeline', () => {
    console.log('[computeLeontiefFromFlowMatrix] Starting: normalizes rows when using flow matrix convenience pipeline');
    const flowMatrix: SparseMatrixCSR = {
      rows: 2,
      cols: 2,
      rowPtr: Uint32Array.from([0, 1, 2]),
      colIdx: Uint32Array.from([1, 0]),
      values: Float64Array.from([2, 1]),
    };

    const direct = computeLeontiefFromFlowMatrix(flowMatrix, { order: 1 });
    const dense = matrixToDense(direct.matrix);
    console.log('[computeLeontiefFromFlowMatrix] Dense matrix:', dense);

    expect(dense[0][0]).toBeCloseTo(1);
    expect(dense[0][1]).toBeCloseTo(1);
    expect(dense[1][0]).toBeCloseTo(1);
    expect(dense[1][1]).toBeCloseTo(1);
  });

  it('throws for invalid order', () => {
    console.log('[computeLeontiefSeries] Starting: throws for invalid order');
    const normalizedA: SparseMatrixCSR = {
      rows: 1,
      cols: 1,
      rowPtr: Uint32Array.from([0, 0]),
      colIdx: Uint32Array.from([]),
      values: Float64Array.from([]),
    };

    expect(() => computeLeontiefSeries(normalizedA, { order: -1 })).toThrow(
      'Leontief series order must be a non-negative integer.',
    );
  });
});
