# Network View Specification (Click-Focus Traversal)

## Purpose
Define the interaction and compute behavior for the network chart view with depth-based neighborhood expansion and focus recentering.

## Initial behavior
- On load, pick a random valid node as center.
- Build visible neighborhood to depth `n = 5`.
- Display center-focused network slice with directional links.

## Core traversal rules
1. Start frontier from `centerNodeId`.
2. Expand to depth `n` (default 5).
3. Respect direction mode (`both` default for MVP).
4. Enforce max node/link caps for rendering stability.
5. Use adjacency indexes (`outByNode`, `inByNode`) to avoid full-link scans per step.

## Interaction behavior
### v1 required
- **Click-focus only**.
- Clicking a node rebuilds the chart with clicked node as new center.
- Depth remains `n = 5` unless user control is later added.

### Specified but post-v1 implementation
- Hover tooltip behavior:
  - Show node `sector`, `region`, and `value`.
  - Keep tooltip lightweight and non-blocking.

## Worker strategy
Heavy graph calculations should be offloaded when needed:
- Neighborhood extraction for large graphs.
- Layout precompute or force simulation prep for larger node counts.

Main thread should only handle rendering and interaction dispatch.

## Data contract
- Input:
  - Graph view model (nodes + links)
  - `centerNodeId`
  - `depth = 5`
  - optional caps (`maxNodes`, `maxLinks`)
- Output:
  - Subgraph `{ nodeIds, links, centerNodeId, depthUsed }`

## State contract
- `network.centerNodeId`
- `network.depth`
- `network.lastTraversalStats` (visited nodes, visited links, elapsed ms)

## Error/edge behavior
- Unknown clicked node -> no-op + warning.
- Center with no neighbors -> render singleton node state.
- Traversal cap reached -> show non-blocking "truncated" indicator.

## Testing (lean)
- Unit: traversal depth correctness at `n=5`.
- Unit: click-focus recenter output changes center and neighborhood.
- Smoke: large sparse synthetic graph traversal completes within budget.

## Future extension hooks
- Depth control slider.
- Direction-only modes (inbound/outbound).
- Pinning/drag and multi-select once click-focus behavior is stable.
