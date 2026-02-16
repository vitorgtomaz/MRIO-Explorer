export type NodeId = string;

export interface NodeMeta {
  id: NodeId;
  label: string;
  region?: string;
  sector?: string;
  attributes?: Record<string, string | number | boolean | null>;
}

export interface SparseMatrixEntry {
  row: number;
  col: number;
  value: number;
}

export interface SparseMatrixCSR {
  rows: number;
  cols: number;
  rowPtr: Uint32Array;
  colIdx: Uint32Array;
  values: Float64Array;
}

export interface SparseMatrixCSC {
  rows: number;
  cols: number;
  colPtr: Uint32Array;
  rowIdx: Uint32Array;
  values: Float64Array;
}

export interface SparseMatrixStore {
  csr: SparseMatrixCSR;
  csc: SparseMatrixCSC;
}

export interface RawDatasetInput {
  version: '1.0';
  nodes: NodeMeta[];
  matrix: {
    rows: number;
    cols: number;
    entries: SparseMatrixEntry[];
  };
}

export interface Dataset {
  version: '1.0';
  nodeOrder: NodeId[];
  nodeMetaById: Map<NodeId, NodeMeta>;
  matrix: SparseMatrixStore;
}
