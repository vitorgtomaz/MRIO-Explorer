import { describe, expect, it } from 'vitest';

import { normalizeRows } from '../src/engine/normalizeRows.js';
import type { SparseMatrixCSR } from '../src/data/models/types.js';

function makeCSR(): SparseMatrixCSR {
  return {
    rows: 3,
    cols: 3,
    rowPtr: Uint32Array.from([0, 2, 3, 3]),
    colIdx: Uint32Array.from([0, 2, 1]),
    values: Float64Array.from([2, 6, 5]),
  };
}

describe('normalizeRows', () => {
  it('normalizes each non-zero row to sum to 1', () => {
    const normalized = normalizeRows(makeCSR());

    expect(normalized.values).toEqual(Float64Array.from([0.25, 0.75, 1]));
    expect(normalized.rowPtr).toEqual(Uint32Array.from([0, 2, 3, 3]));
    expect(normalized.colIdx).toEqual(Uint32Array.from([0, 2, 1]));
  });

  it('keeps zero rows sparse/zero without NaN', () => {
    const normalized = normalizeRows(makeCSR());

    const thirdRowStart = normalized.rowPtr[2];
    const thirdRowEnd = normalized.rowPtr[3];

    expect(thirdRowStart).toBe(thirdRowEnd);
    expect(Number.isNaN(normalized.values[0])).toBe(false);
    expect(Number.isNaN(normalized.values[1])).toBe(false);
    expect(Number.isNaN(normalized.values[2])).toBe(false);
  });
});
