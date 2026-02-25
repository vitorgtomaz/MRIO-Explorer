import type { SparseMatrixCSR } from '../data/models/types.js';
import { normalizeRows } from './normalizeRows.js';
import { addCSR, buildIdentityCSR, multiplyCSR } from './sparseOps.js';

export interface LeontiefSeriesOptions {
  order?: number;
  epsilon?: number;
}

export interface LeontiefSeriesResult {
  matrix: SparseMatrixCSR;
  order: number;
  epsilon: number;
}

function assertSquare(csr: SparseMatrixCSR): void {
  if (csr.rows !== csr.cols) {
    throw new Error('Leontief series requires a square matrix.');
  }
}

function normalizeLeontiefOptions(options?: LeontiefSeriesOptions): Required<LeontiefSeriesOptions> {
  const order = options?.order ?? 20;
  const epsilon = options?.epsilon ?? 0;

  if (!Number.isInteger(order) || order < 0) {
    throw new Error('Leontief series order must be a non-negative integer.');
  }

  if (!Number.isFinite(epsilon) || epsilon < 0) {
    throw new Error('Leontief series epsilon must be a non-negative finite number.');
  }

  return { order, epsilon };
}

/**
 * Computes a truncated Leontief approximation L = I + A + A^2 + ... + A^order.
 */
export function computeLeontiefSeries(
  normalizedA: SparseMatrixCSR,
  options?: LeontiefSeriesOptions,
): LeontiefSeriesResult {
  assertSquare(normalizedA);
  const { order, epsilon } = normalizeLeontiefOptions(options);

  const identity = buildIdentityCSR(normalizedA.rows);
  let sum = identity;
  let power = identity;

  for (let step = 1; step <= order; step += 1) {
    power = multiplyCSR(power, normalizedA, epsilon);
    sum = addCSR(sum, power, epsilon);
  }

  return { matrix: sum, order, epsilon };
}

/**
 * Convenience pipeline for computing Leontief directly from an unnormalized Z-like matrix.
 */
export function computeLeontiefFromFlowMatrix(
  flowMatrix: SparseMatrixCSR,
  options?: LeontiefSeriesOptions,
): LeontiefSeriesResult {
  const normalizedA = normalizeRows(flowMatrix);
  return computeLeontiefSeries(normalizedA, options);
}

