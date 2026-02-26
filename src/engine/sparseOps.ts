import type { SparseMatrixCSR } from '../data/models/types.js';

/**
 * Builds an n×n identity matrix in CSR format.
 */
export function buildIdentityCSR(size: number): SparseMatrixCSR {
  const rowPtr = new Uint32Array(size + 1);
  const colIdx = new Uint32Array(size);
  const values = new Float64Array(size);

  for (let i = 0; i < size; i += 1) {
    rowPtr[i] = i;
    colIdx[i] = i;
    values[i] = 1;
  }

  rowPtr[size] = size;

  return { rows: size, cols: size, rowPtr, colIdx, values };
}

/**
 * Multiplies a CSR matrix by a dense vector. O(nnz).
 */
export function multiplyCSRByVector(csr: SparseMatrixCSR, vector: Float64Array): Float64Array {
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

/**
 * Divides a dense vector by its L2 norm.
 * A zero vector is returned unchanged to avoid NaN propagation.
 */
export function normalizeVector(values: Float64Array): Float64Array {
  let sumSq = 0;
  for (let i = 0; i < values.length; i += 1) sumSq += values[i] * values[i];

  const norm = Math.sqrt(sumSq);
  const out = new Float64Array(values.length);

  if (norm === 0) {
    out.set(values);
    return out;
  }

  for (let i = 0; i < values.length; i += 1) out[i] = values[i] / norm;

  return out;
}

/**
 * Builds a CSR matrix from an array of per-row Maps (col → value).
 * Entries within each row are sorted by column index.
 */
export function csrFromRowMaps(rows: number, cols: number, rowMaps: Map<number, number>[]): SparseMatrixCSR {
  const totalValues = rowMaps.reduce((sum, row) => sum + row.size, 0);
  const rowPtr = new Uint32Array(rows + 1);
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

  return { rows, cols, rowPtr, colIdx, values };
}

/**
 * Sparse matrix addition. Entries with |value| <= epsilon are pruned (default 0).
 * Both matrices must have the same shape.
 */
export function addCSR(left: SparseMatrixCSR, right: SparseMatrixCSR, epsilon = 0): SparseMatrixCSR {
  if (left.rows !== right.rows || left.cols !== right.cols) {
    throw new Error('Cannot add matrices with different shapes.');
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

/**
 * Sparse matrix multiplication. Entries with |value| <= epsilon are pruned (default 0).
 * Requires left.cols === right.rows.
 */
export function multiplyCSR(left: SparseMatrixCSR, right: SparseMatrixCSR, epsilon = 0): SparseMatrixCSR {
  if (left.cols !== right.rows) {
    throw new Error('Cannot multiply matrices with incompatible shapes.');
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

/**
 * Converts a dense n×n array to CSR, skipping zero entries.
 */
export function csrFromDense(matrix: number[][]): SparseMatrixCSR {
  const n = matrix.length;
  const rowCounts = new Uint32Array(n);

  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (matrix[r][c] !== 0) rowCounts[r] += 1;
    }
  }

  const rowPtr = new Uint32Array(n + 1);
  for (let i = 0; i < n; i += 1) rowPtr[i + 1] = rowPtr[i] + rowCounts[i];

  const nnz = rowPtr[n];
  const colIdx = new Uint32Array(nnz);
  const values = new Float64Array(nnz);
  const next = rowPtr.slice();

  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const v = matrix[r][c];
      if (v !== 0) {
        const dest = next[r]++;
        colIdx[dest] = c;
        values[dest] = v;
      }
    }
  }

  return { rows: n, cols: n, rowPtr, colIdx, values };
}

/**
 * Converts a CSR matrix to a dense n×n array.
 */
export function denseFromCSR(csr: SparseMatrixCSR): number[][] {
  const out = Array.from({ length: csr.rows }, () => Array<number>(csr.cols).fill(0));

  for (let row = 0; row < csr.rows; row += 1) {
    for (let idx = csr.rowPtr[row]; idx < csr.rowPtr[row + 1]; idx += 1) {
      out[row][csr.colIdx[idx]] = csr.values[idx];
    }
  }

  return out;
}

/**
 * Returns the transpose of a CSR matrix as a new CSR matrix.
 * Uses a counting-sort scatter so column indices within each row of the
 * result are in ascending order (original rows are processed in order).
 */
export function transposeCSR(csr: SparseMatrixCSR): SparseMatrixCSR {
  const rowCounts = new Uint32Array(csr.cols);

  for (let row = 0; row < csr.rows; row += 1) {
    for (let idx = csr.rowPtr[row]; idx < csr.rowPtr[row + 1]; idx += 1) {
      rowCounts[csr.colIdx[idx]] += 1;
    }
  }

  const rowPtr = new Uint32Array(csr.cols + 1);
  for (let i = 0; i < csr.cols; i += 1) rowPtr[i + 1] = rowPtr[i] + rowCounts[i];

  const nnz = rowPtr[csr.cols];
  const colIdx = new Uint32Array(nnz);
  const values = new Float64Array(nnz);
  const next = rowPtr.slice();

  for (let row = 0; row < csr.rows; row += 1) {
    for (let idx = csr.rowPtr[row]; idx < csr.rowPtr[row + 1]; idx += 1) {
      const dest = next[csr.colIdx[idx]]++;
      colIdx[dest] = row;
      values[dest] = csr.values[idx];
    }
  }

  return { rows: csr.cols, cols: csr.rows, rowPtr, colIdx, values };
}
