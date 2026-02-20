import type { NodeId } from '../../data/models/types.js';
import type { ChartGraphViewModel, ChartLinkViewModel } from './viewModel.js';

export interface NeighborhoodOptions {
  direction?: 'outbound' | 'inbound' | 'both';
  depth?: number;
  maxNodes?: number;
}

export interface NeighborhoodResult {
  centerNodeId: NodeId;
  nodeIds: NodeId[];
  links: ChartLinkViewModel[];
}

export function extractNeighborhood(
  viewModel: ChartGraphViewModel,
  centerNodeId: NodeId,
  options: NeighborhoodOptions = {},
): NeighborhoodResult {
  const direction = options.direction ?? 'both';
  const depth = options.depth ?? 1;
  const maxNodes = options.maxNodes ?? 200;

  if (!Number.isInteger(depth) || depth < 0) {
    throw new Error('depth must be a non-negative integer.');
  }

  if (!Number.isInteger(maxNodes) || maxNodes <= 0) {
    throw new Error('maxNodes must be a positive integer.');
  }

  const nodeExists = viewModel.nodes.some((node) => node.id === centerNodeId);
  if (!nodeExists) {
    throw new Error(`Unknown node id: ${centerNodeId}`);
  }

  const selectedNodeIds = new Set<NodeId>([centerNodeId]);
  let frontier: NodeId[] = [centerNodeId];

  for (let level = 0; level < depth; level += 1) {
    const nextFrontier: NodeId[] = [];

    for (const current of frontier) {
      for (const link of viewModel.links) {
        const outbound = link.source === current;
        const inbound = link.target === current;

        if ((direction === 'both' || direction === 'outbound') && outbound) {
          if (!selectedNodeIds.has(link.target) && selectedNodeIds.size < maxNodes) {
            selectedNodeIds.add(link.target);
            nextFrontier.push(link.target);
          }
        }

        if ((direction === 'both' || direction === 'inbound') && inbound) {
          if (!selectedNodeIds.has(link.source) && selectedNodeIds.size < maxNodes) {
            selectedNodeIds.add(link.source);
            nextFrontier.push(link.source);
          }
        }
      }
    }

    if (nextFrontier.length === 0 || selectedNodeIds.size >= maxNodes) {
      break;
    }

    frontier = nextFrontier;
  }

  const links = viewModel.links.filter(
    (link) => selectedNodeIds.has(link.source) && selectedNodeIds.has(link.target),
  );

  return {
    centerNodeId,
    nodeIds: Array.from(selectedNodeIds),
    links,
  };
}
