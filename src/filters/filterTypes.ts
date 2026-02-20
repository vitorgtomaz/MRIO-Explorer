export type FilterValue = string | number | boolean | null;

export type ComparisonOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | ':';

export interface ComparisonNode {
  type: 'comparison';
  field: string;
  operator: ComparisonOperator;
  value: FilterValue;
}

export interface NotNode {
  type: 'not';
  operand: FilterAst;
}

export interface LogicalNode {
  type: 'and' | 'or';
  left: FilterAst;
  right: FilterAst;
}

export type FilterAst = ComparisonNode | NotNode | LogicalNode;
