import { computeDominantEigenFromFlowMatrix } from '../../engine/eigen.js';
import {
  type Dataset,
  type NodeMeta,
  type RawDatasetInput,
  type SparseMatrixCSC,
  type SparseMatrixCSR,
  type SparseMatrixEntry,
} from '../models/types.js';

function assertFiniteNumber(value: number, message: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(message);
  }
}

function validateVersion(version: string): void {
  if (version !== '1.0') {
    throw new Error(`Unsupported dataset version: ${version}`);
  }
}

function validateNodes(nodes: NodeMeta[]): void {
  const seen = new Set<string>();

  for (const node of nodes) {
    if (!node.id.trim()) {
      throw new Error('Node id is required.');
    }

    if (!node.label.trim()) {
      throw new Error(`Node label is required for id: ${node.id}`);
    }

    if (seen.has(node.id)) {
      throw new Error(`Duplicate node id detected: ${node.id}`);
    }

    seen.add(node.id);
  }
}

function validateEntries(entries: SparseMatrixEntry[], rows: number, cols: number): void {
  for (const entry of entries) {
    if (!Number.isInteger(entry.row) || entry.row < 0 || entry.row >= rows) {
      throw new Error(`Matrix entry row out of bounds: ${entry.row}`);
    }

    if (!Number.isInteger(entry.col) || entry.col < 0 || entry.col >= cols) {
      throw new Error(`Matrix entry col out of bounds: ${entry.col}`);
    }

    assertFiniteNumber(entry.value, 'Matrix entry value must be finite.');
  }
}

function sortEntries(entries: SparseMatrixEntry[]): SparseMatrixEntry[] {
  return [...entries].sort((a, b) => {
    if (a.row !== b.row) {
      return a.row - b.row;
    }

    return a.col - b.col;
  });
}

function assertNoDuplicateCoordinates(entries: SparseMatrixEntry[]): void {
  for (let i = 1; i < entries.length; i += 1) {
    const prev = entries[i - 1];
    const curr = entries[i];

    if (prev.row === curr.row && prev.col === curr.col) {
      throw new Error(`Duplicate matrix coordinate detected: (${curr.row}, ${curr.col})`);
    }
  }
}

function sanitizeValues(entries: SparseMatrixEntry[]): SparseMatrixEntry[] {
  const sanitized: SparseMatrixEntry[] = [];

  for (const entry of entries) {
    if (entry.value < 0) {
      console.warn(
        `Negative matrix value at (${entry.row}, ${entry.col}) was replaced with 0 during ingestion.`,
      );
      continue;
    }

    if (entry.value === 0) {
      continue;
    }

    sanitized.push(entry);
  }

  return sanitized;
}

function buildCSR(rows: number, cols: number, entries: SparseMatrixEntry[]): SparseMatrixCSR {
  const rowCounts = new Uint32Array(rows);

  for (const entry of entries) {
    rowCounts[entry.row] += 1;
  }

  const rowPtr = new Uint32Array(rows + 1);
  for (let i = 0; i < rows; i += 1) {
    rowPtr[i + 1] = rowPtr[i] + rowCounts[i];
  }

  const colIdx = new Uint32Array(entries.length);
  const values = new Float64Array(entries.length);
  const next = rowPtr.slice();

  for (const entry of entries) {
    const dest = next[entry.row];
    colIdx[dest] = entry.col;
    values[dest] = entry.value;
    next[entry.row] += 1;
  }

  return { rows, cols, rowPtr, colIdx, values };
}

function buildCSC(rows: number, cols: number, entries: SparseMatrixEntry[]): SparseMatrixCSC {
  const colCounts = new Uint32Array(cols);

  for (const entry of entries) {
    colCounts[entry.col] += 1;
  }

  const colPtr = new Uint32Array(cols + 1);
  for (let i = 0; i < cols; i += 1) {
    colPtr[i + 1] = colPtr[i] + colCounts[i];
  }

  const rowIdx = new Uint32Array(entries.length);
  const values = new Float64Array(entries.length);
  const next = colPtr.slice();

  for (const entry of entries) {
    const dest = next[entry.col];
    rowIdx[dest] = entry.row;
    values[dest] = entry.value;
    next[entry.col] += 1;
  }

  return { rows, cols, colPtr, rowIdx, values };
}

export function ingestDataset(input: RawDatasetInput): Dataset {
  const { nodes, matrix } = input;

  validateVersion(input.version);

  if (matrix.rows !== nodes.length || matrix.cols !== nodes.length) {
    throw new Error('Matrix shape must match node count.');
  }

  validateNodes(nodes);
  validateEntries(matrix.entries, matrix.rows, matrix.cols);

  const sortedEntries = sortEntries(matrix.entries);
  assertNoDuplicateCoordinates(sortedEntries);
  const normalizedEntries = sanitizeValues(sortedEntries);

  const csr = buildCSR(matrix.rows, matrix.cols, normalizedEntries);

  return {
    version: input.version,
    nodeOrder: nodes.map((node) => node.id),
    nodeMetaById: new Map(nodes.map((node) => [node.id, node])),
    matrix: {
      csr,
      csc: buildCSC(matrix.rows, matrix.cols, normalizedEntries),
    },
    eigen: computeDominantEigenFromFlowMatrix(csr),
  };
}
