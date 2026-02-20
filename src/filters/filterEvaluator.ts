import type { NodeMeta } from '../data/models/types.js';
import { parseFilter } from './filterParser.js';
import type { ComparisonOperator, FilterAst, FilterValue } from './filterTypes.js';

export type NodeFilterEvaluator = (node: NodeMeta) => boolean;

export function compileFilter(ast: FilterAst): NodeFilterEvaluator {
  return (node) => evaluateNode(ast, node);
}

export function buildFilterEvaluator(expression: string): NodeFilterEvaluator {
  return compileFilter(parseFilter(expression));
}

function evaluateNode(ast: FilterAst, node: NodeMeta): boolean {
  switch (ast.type) {
    case 'and':
      return evaluateNode(ast.left, node) && evaluateNode(ast.right, node);
    case 'or':
      return evaluateNode(ast.left, node) || evaluateNode(ast.right, node);
    case 'not':
      return !evaluateNode(ast.operand, node);
    case 'comparison':
      return evaluateComparison(readFieldValue(node, ast.field), ast.operator, ast.value);
    default:
      return false;
  }
}

function readFieldValue(node: NodeMeta, field: string): FilterValue {
  if (field === 'id' || field === 'label' || field === 'region' || field === 'sector') {
    return node[field] ?? null;
  }

  return (node.attributes?.[field] as FilterValue | undefined) ?? null;
}

function evaluateComparison(left: FilterValue, operator: ComparisonOperator, right: FilterValue): boolean {
  if (operator === ':') {
    const leftText = normalizeString(left);
    const rightText = normalizeString(right);
    if (leftText === null || rightText === null) {
      return false;
    }

    return leftText.includes(rightText);
  }

  const leftNumber = asNumber(left);
  const rightNumber = asNumber(right);

  if (leftNumber !== null && rightNumber !== null) {
    return compareNumbers(leftNumber, rightNumber, operator);
  }

  if (operator === '>' || operator === '>=' || operator === '<' || operator === '<=') {
    return false;
  }

  const leftText = normalizeComparable(left);
  const rightText = normalizeComparable(right);

  if (operator === '=') {
    return leftText === rightText;
  }

  if (operator === '!=') {
    return leftText !== rightText;
  }

  return false;
}

function compareNumbers(left: number, right: number, operator: ComparisonOperator): boolean {
  switch (operator) {
    case '=':
      return left === right;
    case '!=':
      return left !== right;
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    default:
      return false;
  }
}

function asNumber(value: FilterValue): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeString(value: FilterValue): string | null {
  if (value === null) {
    return null;
  }

  return String(value).toLowerCase();
}

function normalizeComparable(value: FilterValue): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return value.toLowerCase();
  }

  return String(value);
}
