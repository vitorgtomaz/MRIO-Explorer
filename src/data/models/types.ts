export type NodeId = string;

export interface NodeMeta {
  id: NodeId;
  label: string;
  region?: string;
  sector?: string;
  value?: number;
  attributes?: Record<string, string | number | boolean | null>;
}

export interface DatasetOrderingItem {
  code: string;
  region: string;
  sector: string;
  value: number;
}

export interface DatasetBuildParameters {
  columnNormalizationMethod?: string;
  zeroTreatment?: string;
  balancingMethod?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface DatasetMeta {
  name: string;
  version: '1.0';
  rows: number;
  cols: number;
  nnz: number;
  dtype_data: 'float32' | 'float64';
  dtype_indices: 'int32';
  dtype_indptr: 'int32' | 'int64';
  ordering: DatasetOrderingItem[];
  units: string;
  currency_year: number;
  price_basis: string;
  checksum?: string;
  build_parameters?: DatasetBuildParameters;
}

export interface NpzCsrArrays {
  data: Float32Array | Float64Array;
  indices: Int32Array;
  indptr: Int32Array | BigInt64Array;
  shape?: readonly [number, number];
}

export interface CsrJsonArrays {
  data: number[];
  indices: number[];
  indptr: number[];
  shape?: readonly [number, number];
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

export interface DominantEigenResult {
  value: number;
  vector: Float64Array<ArrayBufferLike>;
  iterations: number;
  converged: boolean;
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
  eigen: DominantEigenResult;
}
