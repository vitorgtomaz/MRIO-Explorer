import type { SparseMatrixCSR } from '../data/models/types.js';

/**
 * Builds row-normalized A from Z-like coefficients in CSR format.
 * Zero-sum rows remain zero to avoid densification or NaN propagation.
 */
export function normalizeRows(csr: SparseMatrixCSR): SparseMatrixCSR {
  const rowSums = new Float64Array(csr.rows);

  for (let row = 0; row < csr.rows; row += 1) {
    for (let idx = csr.rowPtr[row]; idx < csr.rowPtr[row + 1]; idx += 1) {
      rowSums[row] += csr.values[idx];
    }
  }

  const normalizedValues = new Float64Array(csr.values.length);

  for (let row = 0; row < csr.rows; row += 1) {
    const rowStart = csr.rowPtr[row];
    const rowEnd = csr.rowPtr[row + 1];
    const denom = rowSums[row];

    if (denom === 0) {
      continue;
    }

    for (let idx = rowStart; idx < rowEnd; idx += 1) {
      normalizedValues[idx] = csr.values[idx] / denom;
    }
  }

  return {
    rows: csr.rows,
    cols: csr.cols,
    rowPtr: csr.rowPtr,
    colIdx: csr.colIdx,
    values: normalizedValues,
  };
}
