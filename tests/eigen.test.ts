import { describe, expect, it } from 'vitest';

import {
  computeDominantEigenFromFlowMatrix,
  computeDominantEigenpair,
} from '../src/engine/eigen.js';
import type { SparseMatrixCSR } from '../src/data/models/types.js';

describe('computeDominantEigenpair', () => {
  it('returns dominant eigenpair for a simple diagonal matrix', () => {
    const normalizedA: SparseMatrixCSR = {
      rows: 2,
      cols: 2,
      rowPtr: Uint32Array.from([0, 1, 2]),
      colIdx: Uint32Array.from([0, 1]),
      values: Float64Array.from([2, 1]),
    };

    const result = computeDominantEigenpair(normalizedA, {
      maxIterations: 200,
      tolerance: 1e-10,
    });

    expect(result.converged).toBe(true);
    expect(result.value).toBeCloseTo(2, 6);
    expect(result.vector[0]).toBeCloseTo(1, 4);
    expect(Math.abs(result.vector[1])).toBeLessThan(0.02);
  });

  it('normalizes rows for the flow-matrix convenience pipeline', () => {
    const flowMatrix: SparseMatrixCSR = {
      rows: 2,
      cols: 2,
      rowPtr: Uint32Array.from([0, 2, 3]),
      colIdx: Uint32Array.from([0, 1, 1]),
      values: Float64Array.from([2, 2, 3]),
    };

    const result = computeDominantEigenFromFlowMatrix(flowMatrix);

    expect(result.converged).toBe(true);
    expect(result.value).toBeCloseTo(1, 6);
  });

  it('throws for invalid options', () => {
    const normalizedA: SparseMatrixCSR = {
      rows: 1,
      cols: 1,
      rowPtr: Uint32Array.from([0, 0]),
      colIdx: Uint32Array.from([]),
      values: Float64Array.from([]),
    };

    expect(() => computeDominantEigenpair(normalizedA, { maxIterations: 0 })).toThrow(
      'Eigen maxIterations must be a positive integer.',
    );
  });
});
