import type { SparseMatrixCSR } from '../data/models/types.js';
import { normalizeRows } from './normalizeRows.js';

export interface DominantEigenOptions {
  maxIterations?: number;
  tolerance?: number;
}

export interface DominantEigenResult {
  value: number;
  vector: Float64Array<ArrayBufferLike>;
  iterations: number;
  converged: boolean;
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

function l2Norm(values: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i] * values[i];
  }

  return Math.sqrt(sum);
}

function normalizeVector(values: Float64Array): Float64Array {
  const norm = l2Norm(values);
  const out = new Float64Array(values.length);

  if (norm === 0) {
    out.set(values);
    return out;
  }
  for (let i = 0; i < values.length; i += 1) {
    out[i] = values[i] / norm;
  }

  return out;
}

function multiplyCSRByVector(csr: SparseMatrixCSR, vector: Float64Array): Float64Array {
  const out = new Float64Array(csr.rows);

  for (let row = 0; row < csr.rows; row += 1) {
    let sum = 0;
    for (let idx = csr.rowPtr[row]; idx < csr.rowPtr[row + 1]; idx += 1) {
      sum += csr.values[idx] * vector[csr.colIdx[idx]];
    }
    out[row] = sum;
  }

  return out;
}

function rayleighQuotient(csr: SparseMatrixCSR, vector: Float64Array): number {
  const multiplied = multiplyCSRByVector(csr, vector);
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < vector.length; i += 1) {
    numerator += vector[i] * multiplied[i];
    denominator += vector[i] * vector[i];
  }

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
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
    const nextRaw = multiplyCSRByVector(normalizedA, vector);
    const nextVector = normalizeVector(nextRaw);

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
