import type { ChartGraphViewModel } from '../core/viewModel.js';

export interface D3ForceNodeDatum {
  id: string;
  label: string;
  group: string;
  size: number;
}

export interface D3ForceLinkDatum {
  source: string;
  target: string;
  value: number;
  strength: number;
}

export interface D3ForceGraphData {
  nodes: D3ForceNodeDatum[];
  links: D3ForceLinkDatum[];
}

export function toD3ForceGraphData(viewModel: ChartGraphViewModel): D3ForceGraphData {
  const maxFlow = viewModel.nodes.reduce((max, node) => {
    const nodeFlow = node.totalInFlow + node.totalOutFlow;
    return nodeFlow > max ? nodeFlow : max;
  }, 0);

  const nodes: D3ForceNodeDatum[] = viewModel.nodes.map((node) => {
    const rawFlow = node.totalInFlow + node.totalOutFlow;
    const normalized = maxFlow > 0 ? rawFlow / maxFlow : 0;

    return {
      id: node.id,
      label: node.label,
      group: node.region ?? node.sector ?? 'default',
      size: 8 + (normalized * 20),
    };
  });

  const links: D3ForceLinkDatum[] = viewModel.links.map((link) => ({
    source: link.source,
    target: link.target,
    value: link.value,
    strength: Math.max(0.05, Math.min(1, link.value)),
  }));

  return { nodes, links };
}
