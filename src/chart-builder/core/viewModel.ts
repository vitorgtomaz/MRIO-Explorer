import type { Dataset, NodeId } from '../../data/models/types.js';

export interface ChartNodeViewModel {
  id: NodeId;
  label: string;
  region?: string;
  sector?: string;
  outDegree: number;
  inDegree: number;
  totalOutFlow: number;
  totalInFlow: number;
}

export interface ChartLinkViewModel {
  source: NodeId;
  target: NodeId;
  value: number;
}

export interface ChartGraphViewModel {
  nodes: ChartNodeViewModel[];
  links: ChartLinkViewModel[];
}

export interface BuildChartViewModelOptions {
  minLinkValue?: number;
  maxLinks?: number;
}

export function buildChartGraphViewModel(
  dataset: Dataset,
  options: BuildChartViewModelOptions = {},
): ChartGraphViewModel {
  const minLinkValue = options.minLinkValue ?? 0;
  const maxLinks = options.maxLinks;

  if (minLinkValue < 0 || !Number.isFinite(minLinkValue)) {
    throw new Error('minLinkValue must be a finite number greater than or equal to 0.');
  }

  if (maxLinks !== undefined && (!Number.isInteger(maxLinks) || maxLinks <= 0)) {
    throw new Error('maxLinks must be a positive integer when provided.');
  }

  const links: ChartLinkViewModel[] = [];
  const { csr } = dataset.matrix;

  for (let row = 0; row < csr.rows; row += 1) {
    const sourceId = dataset.nodeOrder[row];

    for (let idx = csr.rowPtr[row]; idx < csr.rowPtr[row + 1]; idx += 1) {
      const value = csr.values[idx];
      if (value < minLinkValue) {
        continue;
      }

      const targetId = dataset.nodeOrder[csr.colIdx[idx]];
      links.push({ source: sourceId, target: targetId, value });
    }
  }

  if (maxLinks !== undefined && links.length > maxLinks) {
    links.sort((a, b) => b.value - a.value);
    links.length = maxLinks;
  }

  const outDegree = new Map<NodeId, number>();
  const inDegree = new Map<NodeId, number>();
  const totalOutFlow = new Map<NodeId, number>();
  const totalInFlow = new Map<NodeId, number>();

  for (const link of links) {
    outDegree.set(link.source, (outDegree.get(link.source) ?? 0) + 1);
    inDegree.set(link.target, (inDegree.get(link.target) ?? 0) + 1);
    totalOutFlow.set(link.source, (totalOutFlow.get(link.source) ?? 0) + link.value);
    totalInFlow.set(link.target, (totalInFlow.get(link.target) ?? 0) + link.value);
  }

  const nodes: ChartNodeViewModel[] = dataset.nodeOrder.map((id) => {
    const meta = dataset.nodeMetaById.get(id);
    if (!meta) {
      throw new Error(`Missing node metadata for node id: ${id}`);
    }

    return {
      id,
      label: meta.label,
      region: meta.region,
      sector: meta.sector,
      outDegree: outDegree.get(id) ?? 0,
      inDegree: inDegree.get(id) ?? 0,
      totalOutFlow: totalOutFlow.get(id) ?? 0,
      totalInFlow: totalInFlow.get(id) ?? 0,
    };
  });

  return { nodes, links };
}
