import { describe, expect, it } from 'vitest';

import type { NodeMeta } from '../src/data/models/types.js';
import { buildFilterEvaluator } from '../src/filters/filterEvaluator.js';
import { FilterSyntaxError, parseFilter } from '../src/filters/filterParser.js';

const node: NodeMeta = {
  id: 'N1',
  label: 'Steel Manufacturing',
  region: 'EU',
  sector: 'Manufacturing',
  attributes: {
    score: 42,
    active: true,
    owner: 'TeamA',
  },
};

describe('parseFilter', () => {
  it('parses compound expressions with precedence and parentheses', () => {
    const ast = parseFilter('region = EU and (score >= 40 or not active = true)');
    expect(ast.type).toBe('and');
  });

  it('throws user-facing syntax errors for invalid expressions', () => {
    expect(() => parseFilter('region = ')).toThrow(FilterSyntaxError);
    expect(() => parseFilter('region @@ EU')).toThrow('Unexpected character "@"');
    expect(() => parseFilter('')).toThrow('Filter cannot be empty.');
  });
});

describe('buildFilterEvaluator', () => {
  it('evaluates numeric and string comparisons', () => {
    expect(buildFilterEvaluator('score >= 40')(node)).toBe(true);
    expect(buildFilterEvaluator('score < 40')(node)).toBe(false);
    expect(buildFilterEvaluator('region = eu')(node)).toBe(true);
  });

  it('supports contains operator and attribute lookups', () => {
    expect(buildFilterEvaluator('label : "steel"')(node)).toBe(true);
    expect(buildFilterEvaluator('owner = TeamA')(node)).toBe(true);
    expect(buildFilterEvaluator('owner != TeamB')(node)).toBe(true);
  });

  it('supports not/and/or composition', () => {
    expect(buildFilterEvaluator('region = EU and not owner = TeamB')(node)).toBe(true);
    expect(buildFilterEvaluator('region = APAC or owner = TeamA')(node)).toBe(true);
    expect(buildFilterEvaluator('region = APAC and owner = TeamA')(node)).toBe(false);
  });

  it('returns false when fields are missing for comparison operators', () => {
    expect(buildFilterEvaluator('missingField = anything')(node)).toBe(false);
    expect(buildFilterEvaluator('missingField > 1')(node)).toBe(false);
    expect(buildFilterEvaluator('missingField : value')(node)).toBe(false);
  });
});
