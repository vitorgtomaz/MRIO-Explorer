import type { SparseMatrixCSR } from '../data/models/types.js';
import { normalizeRows } from './normalizeRows.js';

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

function buildIdentity(size: number): SparseMatrixCSR {
  const rowPtr = new Uint32Array(size + 1);
  const colIdx = new Uint32Array(size);
  const values = new Float64Array(size);

  for (let i = 0; i < size; i += 1) {
    rowPtr[i] = i;
    colIdx[i] = i;
    values[i] = 1;
  }

  rowPtr[size] = size;

  return {
    rows: size,
    cols: size,
    rowPtr,
    colIdx,
    values,
  };
}

function csrFromRowMaps(rows: number, cols: number, rowMaps: Map<number, number>[]): SparseMatrixCSR {
  const rowPtr = new Uint32Array(rows + 1);
  const totalValues = rowMaps.reduce((sum, row) => sum + row.size, 0);
  const colIdx = new Uint32Array(totalValues);
  const values = new Float64Array(totalValues);

  let offset = 0;
  for (let row = 0; row < rows; row += 1) {
    rowPtr[row] = offset;
    const entries = [...rowMaps[row].entries()].sort((a, b) => a[0] - b[0]);

    for (const [col, value] of entries) {
      colIdx[offset] = col;
      values[offset] = value;
      offset += 1;
    }
  }

  rowPtr[rows] = offset;

  return {
    rows,
    cols,
    rowPtr,
    colIdx,
    values,
  };
}

function addCSR(left: SparseMatrixCSR, right: SparseMatrixCSR, epsilon: number): SparseMatrixCSR {
  assertSquare(left);
  assertSquare(right);

  if (left.rows !== right.rows) {
    throw new Error('Cannot add sparse matrices with different shapes.');
  }

  const rowMaps = Array.from({ length: left.rows }, () => new Map<number, number>());

  for (let row = 0; row < left.rows; row += 1) {
    for (let idx = left.rowPtr[row]; idx < left.rowPtr[row + 1]; idx += 1) {
      rowMaps[row].set(left.colIdx[idx], left.values[idx]);
    }

    for (let idx = right.rowPtr[row]; idx < right.rowPtr[row + 1]; idx += 1) {
      const col = right.colIdx[idx];
      const nextValue = (rowMaps[row].get(col) ?? 0) + right.values[idx];

      if (Math.abs(nextValue) <= epsilon) {
        rowMaps[row].delete(col);
      } else {
        rowMaps[row].set(col, nextValue);
      }
    }
  }

  return csrFromRowMaps(left.rows, left.cols, rowMaps);
}

function multiplyCSR(left: SparseMatrixCSR, right: SparseMatrixCSR, epsilon: number): SparseMatrixCSR {
  assertSquare(left);
  assertSquare(right);

  if (left.cols !== right.rows) {
    throw new Error('Cannot multiply sparse matrices with incompatible shapes.');
  }

  const rowMaps = Array.from({ length: left.rows }, () => new Map<number, number>());

  for (let row = 0; row < left.rows; row += 1) {
    const accumulator = rowMaps[row];

    for (let leftIdx = left.rowPtr[row]; leftIdx < left.rowPtr[row + 1]; leftIdx += 1) {
      const intermediateRow = left.colIdx[leftIdx];
      const leftValue = left.values[leftIdx];

      for (
        let rightIdx = right.rowPtr[intermediateRow];
        rightIdx < right.rowPtr[intermediateRow + 1];
        rightIdx += 1
      ) {
        const col = right.colIdx[rightIdx];
        const partial = leftValue * right.values[rightIdx];
        const nextValue = (accumulator.get(col) ?? 0) + partial;

        if (Math.abs(nextValue) <= epsilon) {
          accumulator.delete(col);
        } else {
          accumulator.set(col, nextValue);
        }
      }
    }
  }

  return csrFromRowMaps(left.rows, right.cols, rowMaps);
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

  const identity = buildIdentity(normalizedA.rows);
  let sum = identity;
  let power = identity;

  for (let step = 1; step <= order; step += 1) {
    power = multiplyCSR(power, normalizedA, epsilon);
    sum = addCSR(sum, power, epsilon);
  }

  return {
    matrix: sum,
    order,
    epsilon,
  };
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
