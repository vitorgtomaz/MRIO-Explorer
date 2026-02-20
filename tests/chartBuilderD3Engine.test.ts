import { describe, expect, it } from 'vitest';

import { toD3ForceGraphData } from '../src/chart-builder/adapters/d3ForceAdapter.js';
import { extractNeighborhood } from '../src/chart-builder/core/neighborhood.js';
import { buildChartGraphViewModel } from '../src/chart-builder/core/viewModel.js';
import { ingestDataset } from '../src/data/ingest/ingestDataset.js';
import type { RawDatasetInput } from '../src/data/models/types.js';

const input: RawDatasetInput = {
  version: '1.0',
  nodes: [
    { id: 'A', label: 'Agriculture', region: 'Coast' },
    { id: 'B', label: 'Manufacturing', region: 'Coast' },
    { id: 'C', label: 'Services', region: 'Highlands' },
    { id: 'D', label: 'Transport', region: 'Amazon' },
  ],
  matrix: {
    rows: 4,
    cols: 4,
    entries: [
      { row: 0, col: 1, value: 8 },
      { row: 1, col: 2, value: 3 },
      { row: 2, col: 0, value: 2 },
      { row: 1, col: 3, value: 1 },
    ],
  },
};

describe('D3 chart builder engine', () => {
  it('builds a chart view model and supports max-link filtering', () => {
    const dataset = ingestDataset(input);

    const viewModel = buildChartGraphViewModel(dataset, { minLinkValue: 2, maxLinks: 2 });

    expect(viewModel.nodes).toHaveLength(4);
    expect(viewModel.links).toHaveLength(2);
    expect(viewModel.links[0].value).toBeGreaterThanOrEqual(viewModel.links[1].value);

    const nodeB = viewModel.nodes.find((node) => node.id === 'B');
    expect(nodeB?.outDegree).toBe(1);
    expect(nodeB?.totalOutFlow).toBeCloseTo(3);
  });

  it('maps chart view model to D3 force data', () => {
    const dataset = ingestDataset(input);
    const viewModel = buildChartGraphViewModel(dataset);

    const d3Data = toD3ForceGraphData(viewModel);

    expect(d3Data.nodes).toHaveLength(4);
    expect(d3Data.links).toHaveLength(4);
    expect(d3Data.nodes.every((node) => node.size >= 8)).toBe(true);
    expect(d3Data.links.every((link) => link.strength >= 0.05 && link.strength <= 1)).toBe(true);
  });

  it('extracts inbound and outbound neighborhoods for click-to-focus', () => {
    const dataset = ingestDataset(input);
    const viewModel = buildChartGraphViewModel(dataset);

    const neighborhood = extractNeighborhood(viewModel, 'B', { direction: 'both', depth: 1 });

    expect(neighborhood.centerNodeId).toBe('B');
    expect(neighborhood.nodeIds.sort()).toEqual(['A', 'B', 'C', 'D']);
    expect(neighborhood.links).toHaveLength(4);
  });
});
