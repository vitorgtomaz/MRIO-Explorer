# AGENTS.md

## Mission
Build MRIO Explorer as a fast, browser-based MVP for exploring MRIO datasets.
Prioritize simple, modular architecture so upgrades are easy and failures are isolated.

## Product priorities (MVP)
1. Working chart builder with core interactions.
2. Good performance on reasonably large sparse datasets.
3. Low complexity and easy iteration over strict completeness.

## Development principles
- Keep modules small and decoupled.
- Prefer readable implementations over clever abstractions.
- Add only the minimum checks/tests needed to move safely.
- Avoid heavy upfront complexity; fix bugs and refine as we learn.
- Do not over-engineer parser/filter capabilities.

## Architecture rules
- Put matrix/domain logic in `src/engine/`.
- Put chart-specific transformation logic in `src/chart-builder/`.
- Put text filter parsing/evaluation in `src/filters/`.
- Keep state handling in `src/state/`.
- Long-running or heavy computations must go through `src/workers/`.
- UI should orchestrate, not own heavy compute logic.

## Filter scope
- Filter is text-based and flexible, but intentionally limited.
- Do not build full SQL grammar or SQL execution.
- Focus on a practical subset that is easy to maintain.

## Performance rules
- Keep sparse matrices sparse.
- Avoid densifying large structures.
- Move expensive operations off the main thread when needed.
- Profile hot paths before rewriting major internals.

## Testing approach (lean)
- Add focused unit tests for high-risk logic only.
- Avoid large, brittle test suites in early MVP.
- Prefer a few stable smoke checks over exhaustive coverage.

## Pull request checklist
- [ ] Change is modular and scoped.
- [ ] No unnecessary complexity added.
- [ ] Folder/module ownership is respected.
- [ ] Any new logic has minimal validation or smoke test if high-risk.
- [ ] Docs/TODO updated if scope changed.
