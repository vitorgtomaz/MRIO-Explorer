# Key Design Questions (Living Document)

Use this file as a running decision log seed. Resolve questions as implementation progresses.

## A) Data model and ingestion
1. What exact input formats are supported in MVP (CSV only, JSON only, both)?
2. [DECIDED] Sparse representation: hybrid CSR + CSC (CSR primary, CSC secondary index).
3. How do we handle zero-output rows during A normalization?
4. What are the required metadata fields beyond `sector` and `region`?
5. What file size limits do we impose for browser-only processing?

## B) Compute strategy
6. Which operations are synchronous on initial MVP vs worker-offloaded?
7. [DECIDED] Compute Leontief and Eigen eagerly at load time.
8. [DECIDED] Leontief default degree/order is 20, with manual precision override for higher order when needed.
9. What cache keys and invalidation strategy should we use?

## C) Filter language
10. What exact filter grammar is needed for MVP (operators and precedence)?
11. Which fields are filterable in MVP?
12. Should filter evaluation return ranked matches or only boolean inclusion?
13. How should invalid filter input be surfaced to users?

## D) Chart interaction behavior
14. Which chart types are in scope for MVP and in what order?
15. What is the default behavior on node click for each chart type?
16. How far should neighborhood expansion go by default (1-hop, configurable)?
17. What interactions are mandatory for v1 (hover, drag, click-focus)?

## E) UX and state
18. What should be persisted between sessions (chart config, filters, selected nodes)?
19. How do we recover from failed compute tasks without app reload?
20. What loading/fallback states are acceptable for long-running operations?

## F) Performance
21. What are target dataset sizes for MVP “works fairly well”?
22. What latency threshold is acceptable for hover/click interactions?
23. Which metrics do we log in dev mode to detect regressions early?

## G) Reliability and maintainability
24. Which modules are considered stable contracts vs evolving internals?
25. When do we refactor vs patch in place during fast iteration?
26. What minimal tests are required before merging changes in core math/filter logic?

