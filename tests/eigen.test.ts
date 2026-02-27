import { describe, expect, it } from 'vitest';

import {
  computeDominantEigenFromFlowMatrix,
  computeDominantEigenpair,
} from '../src/engine/eigen.js';
import type { SparseMatrixCSR } from '../src/data/models/types.js';
import { normalizeRows } from '../src/engine/normalizeRows.js';
import { multiplyCSRByVector } from '../src/engine/sparseOps.js';

describe('computeDominantEigenpair', () => {
  it('returns dominant eigenpair for a simple diagonal matrix', () => {
    console.log('[computeDominantEigenpair] Starting: returns dominant eigenpair for a simple diagonal matrix');
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

    console.log('[computeDominantEigenpair] Result:', {
      converged: result.converged,
      value: result.value,
      vector: Array.from(result.vector),
      iterations: result.iterations,
    });

    expect(result.converged).toBe(true);
    expect(result.value).toBeCloseTo(2, 6);
    expect(result.vector[0]).toBeCloseTo(1, 4);
    expect(Math.abs(result.vector[1])).toBeLessThan(0.02);
  });

  it('normalizes rows for the flow-matrix convenience pipeline', () => {
    console.log('[computeDominantEigenFromFlowMatrix] Starting: normalizes rows for the flow-matrix convenience pipeline');
    const flowMatrix: SparseMatrixCSR = {
      rows: 2,
      cols: 2,
      rowPtr: Uint32Array.from([0, 2, 3]),
      colIdx: Uint32Array.from([0, 1, 1]),
      values: Float64Array.from([2, 2, 3]),
    };

    const result = computeDominantEigenFromFlowMatrix(flowMatrix);
    console.log('[computeDominantEigenFromFlowMatrix] Result:', {
      converged: result.converged,
      value: result.value,
      vector: Array.from(result.vector),
      iterations: result.iterations,
    });

    console.log('[computeDominantEigenpair] Result:', {
      converged: result.converged,
      value: result.value,
      vector: Array.from(result.vector),
      iterations: result.iterations,
    });

    expect(result.converged).toBe(true);
    expect(result.value).toBeCloseTo(1, 6);
  });

  it('returns a stable dominant eigenpair for a denser 3x3 flow matrix', () => {
    console.log('[computeDominantEigenFromFlowMatrix] Starting: returns a stable dominant eigenpair for a denser 3x3 flow matrix');
    const flowMatrix: SparseMatrixCSR = {
      rows: 3,
      cols: 3,
      rowPtr: Uint32Array.from([0, 3, 6, 9]),
      colIdx: Uint32Array.from([0, 1, 2, 0, 1, 2, 0, 1, 2]),
      values: Float64Array.from([
        5, 2, 1,
        1, 4, 3,
        2, 2, 6,
      ]),
    };
    console.log('[computeDominantEigenFromFlowMatrix] Flow matrix values:', Array.from(flowMatrix.values));

    const result = computeDominantEigenFromFlowMatrix(flowMatrix, {
      maxIterations: 500,
      tolerance: 1e-12,
    });
    console.log('[computeDominantEigenFromFlowMatrix] Result:', {
      converged: result.converged,
      value: result.value,
      vector: Array.from(result.vector),
      iterations: result.iterations,
    });

    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThan(120);
    expect(result.value).toBeCloseTo(1, 10);

    const expectedComponent = 1 / Math.sqrt(3);
    expect(result.vector[0]).toBeCloseTo(expectedComponent, 8);
    expect(result.vector[1]).toBeCloseTo(expectedComponent, 8);
    expect(result.vector[2]).toBeCloseTo(expectedComponent, 8);

    const l2Norm = Math.hypot(result.vector[0], result.vector[1], result.vector[2]);
    expect(l2Norm).toBeCloseTo(1, 12);

    const normalized = normalizeRows(flowMatrix);
    const av = multiplyCSRByVector(normalized, result.vector);
    const residual = Math.max(
      Math.abs(av[0] - result.value * result.vector[0]),
      Math.abs(av[1] - result.value * result.vector[1]),
      Math.abs(av[2] - result.value * result.vector[2]),
    );
    console.log('[computeDominantEigenFromFlowMatrix] Residual infinity norm:', residual);
    expect(residual).toBeLessThan(1e-10);
  });

  it('throws for invalid options', () => {
    console.log('[computeDominantEigenpair] Starting: throws for invalid options');
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
