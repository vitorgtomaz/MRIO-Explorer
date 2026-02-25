import type { DominantEigenResult, SparseMatrixCSR } from '../data/models/types.js';
import { normalizeRows } from './normalizeRows.js';
import { multiplyCSRByVector, normalizeVector } from './sparseOps.js';

export interface DominantEigenOptions {
  maxIterations?: number;
  tolerance?: number;
}

function assertSquare(csr: SparseMatrixCSR): void {
  if (csr.rows !== csr.cols) {
    throw new Error('Eigen pipeline requires a square matrix.');
  }
}

function normalizeOptions(options?: DominantEigenOptions): Required<DominantEigenOptions> {
  const maxIterations = options?.maxIterations ?? 100;
  const tolerance = options?.tolerance ?? 1e-8;

  if (!Number.isInteger(maxIterations) || maxIterations < 1) {
    throw new Error('Eigen maxIterations must be a positive integer.');
  }

  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new Error('Eigen tolerance must be a positive finite number.');
  }

  return { maxIterations, tolerance };
}

function rayleighQuotient(csr: SparseMatrixCSR, vector: Float64Array): number {
  const multiplied = multiplyCSRByVector(csr, vector);
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < vector.length; i += 1) {
    numerator += vector[i] * multiplied[i];
    denominator += vector[i] * vector[i];
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Computes dominant eigenpair of a row-normalized matrix using power iteration.
 */
export function computeDominantEigenpair(
  normalizedA: SparseMatrixCSR,
  options?: DominantEigenOptions,
): DominantEigenResult {
  assertSquare(normalizedA);
  const { maxIterations, tolerance } = normalizeOptions(options);

  let vector: Float64Array<ArrayBufferLike> = new Float64Array(normalizedA.rows);
  vector.fill(1 / Math.sqrt(normalizedA.rows));

  let converged = false;
  let iterations = 0;

  for (let step = 1; step <= maxIterations; step += 1) {
    const nextVector = normalizeVector(multiplyCSRByVector(normalizedA, vector));

    let maxDelta = 0;
    for (let i = 0; i < nextVector.length; i += 1) {
      maxDelta = Math.max(maxDelta, Math.abs(nextVector[i] - vector[i]));
    }

    vector = nextVector;
    iterations = step;

    if (maxDelta <= tolerance) {
      converged = true;
      break;
    }
  }

  return {
    value: rayleighQuotient(normalizedA, vector),
    vector,
    iterations,
    converged,
  };
}

/**
 * Convenience pipeline for computing dominant eigenpair directly from a flow matrix.
 */
export function computeDominantEigenFromFlowMatrix(
  flowMatrix: SparseMatrixCSR,
  options?: DominantEigenOptions,
): DominantEigenResult {
  const normalizedA = normalizeRows(flowMatrix);
  return computeDominantEigenpair(normalizedA, options);
}
