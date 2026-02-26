# Key Design Questions (Living Decision Log)

Use this file as a compact decision tracker. Mark items as:
- **[OPEN]** needs decision,
- **[DECIDED]** locked for current MVP,
- **[DEFERRED]** postponed intentionally.

---

## A) Data model and ingestion
1. **[OPEN]** What exact input formats are supported in MVP (CSV only, JSON only, both)?
2. **[DECIDED]** Sparse representation is hybrid CSR + CSC (CSR primary, CSC secondary index).
3. **[DECIDED]** Zero-output rows remain zero during normalization (no NaN, no densification).
4. **[DECIDED]** Required metadata fields are `sector`, `region`, and `value` (in addition to stable node identity fields).
5. **[OPEN]** What file size limits should browser-only processing support?
6. **[DECIDED]** Negative matrix entries are clamped to zero and emit a user-facing warning message.

## B) Compute strategy
7. **[DECIDED]** Heavy matrix operations must run in workers (eigen, Leontief, precision override recomputes).
8. **[DECIDED]** Heavy graphics calculations (e.g., larger network layout preparation) must run in workers when they risk blocking interaction.
9. **[DECIDED]** Leontief default order is 20 with manual precision override path planned.
10. **[OPEN]** What cache keys/invalidation rules should be used for derived compute results?
11. **[DEFERRED]** Worker timeout/retry/cancellation policy is moved to backlog after click-focus v1.

## C) Filter language
12. **[DECIDED]** MVP grammar supports boolean expressions + comparison ops (`=`, `!=`, `>`, `>=`, `<`, `<=`, `:`).
13. **[DECIDED]** Precedence is `NOT` > `AND` > `OR`.
14. **[DECIDED]** All metadata fields must be discoverable/filterable in UI (not a hand-picked subset).
15. **[OPEN]** Should evaluation remain boolean-only or optionally return ranking/scoring later?
16. **[DECIDED]** Invalid filter syntax throws explicit, position-aware parser errors.

## D) Chart interaction behavior
17. **[DECIDED]** Chart roadmap priority: network, sankey (sector→sector and region→region), spy (Leontief view), histogram (value distribution), circular packing, chord.
18. **[DECIDED]** First interactive chart for implementation is histogram.
19. **[DECIDED]** Network default neighborhood depth starts at `n = 5` from a random seed node.
20. **[DECIDED]** v1 interaction scope is click-focus only.
21. **[DECIDED]** Network click behavior: rebuild chart centered on clicked node.
22. **[DECIDED]** Network hover behavior specification exists (show sector/region/value), but hover is outside strict v1 click-focus scope.
23. **[OPEN]** Should node metrics stay stable when render links are capped (`maxLinks`)?

## E) UX and state
24. **[DEFERRED]** Persistence between sessions is moved to backlog.
25. **[DEFERRED]** Worker failure recovery UX is moved to backlog.
26. **[OPEN]** What loading states are required for long-running compute?
27. **[OPEN]** How should precision-cost tradeoffs be communicated to users?

## F) Performance targets
28. **[OPEN]** What dataset size defines “works fairly well” for MVP?
29. **[OPEN]** What latency budget is acceptable for click/hover interactions?
30. **[OPEN]** Which benchmark scenarios become required regression checks?
31. **[OPEN]** What memory ceiling should be considered safe in browser contexts?

## G) Reliability and maintainability
32. **[DECIDED]** Keep modules small and replaceable; avoid heavy abstractions.
33. **[DECIDED]** Add focused tests for high-risk logic only.
34. **[DECIDED]** Stable contracts include all sparse matrix operation interfaces and behavior guarantees.
35. **[OPEN]** What criteria trigger refactor instead of patching?
36. **[OPEN]** What minimum pre-merge checks are mandatory for engine/filter/chart-core changes?
