import type { ComparisonOperator, FilterAst, FilterValue } from './filterTypes.js';

type TokenKind =
  | 'identifier'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'operator'
  | 'and'
  | 'or'
  | 'not'
  | 'lparen'
  | 'rparen'
  | 'eof';

interface Token {
  kind: TokenKind;
  value: string;
  position: number;
}

const twoCharOperators = new Set(['!=', '>=', '<=']);
const oneCharOperators = new Set(['=', '>', '<', ':']);

export class FilterSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FilterSyntaxError';
  }
}

class Tokenizer {
  private index = 0;

  constructor(private readonly input: string) {}

  nextToken(): Token {
    this.skipWhitespace();

    if (this.index >= this.input.length) {
      return { kind: 'eof', value: '', position: this.index };
    }

    const start = this.index;
    const char = this.input[this.index];

    if (char === '(') {
      this.index += 1;
      return { kind: 'lparen', value: '(', position: start };
    }

    if (char === ')') {
      this.index += 1;
      return { kind: 'rparen', value: ')', position: start };
    }

    if (char === '"' || char === "'") {
      return this.readString(char);
    }

    const maybeTwoCharOperator = this.input.slice(this.index, this.index + 2);
    if (twoCharOperators.has(maybeTwoCharOperator)) {
      this.index += 2;
      return { kind: 'operator', value: maybeTwoCharOperator, position: start };
    }

    if (oneCharOperators.has(char)) {
      this.index += 1;
      return { kind: 'operator', value: char, position: start };
    }

    if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek(1)))) {
      return this.readNumber();
    }

    if (this.isIdentifierStart(char)) {
      return this.readIdentifierOrKeyword();
    }

    throw new FilterSyntaxError(`Unexpected character "${char}" at position ${start}.`);
  }

  private readString(quote: string): Token {
    const start = this.index;
    this.index += 1;
    let output = '';

    while (this.index < this.input.length) {
      const current = this.input[this.index];

      if (current === '\\') {
        const escaped = this.peek(1);
        if (escaped === undefined) {
          throw new FilterSyntaxError(`Unterminated string at position ${start}.`);
        }

        output += escaped;
        this.index += 2;
        continue;
      }

      if (current === quote) {
        this.index += 1;
        return { kind: 'string', value: output, position: start };
      }

      output += current;
      this.index += 1;
    }

    throw new FilterSyntaxError(`Unterminated string at position ${start}.`);
  }

  private readNumber(): Token {
    const start = this.index;
    if (this.input[this.index] === '-') {
      this.index += 1;
    }

    while (this.isDigit(this.input[this.index])) {
      this.index += 1;
    }

    if (this.input[this.index] === '.') {
      this.index += 1;
      while (this.isDigit(this.input[this.index])) {
        this.index += 1;
      }
    }

    return {
      kind: 'number',
      value: this.input.slice(start, this.index),
      position: start,
    };
  }

  private readIdentifierOrKeyword(): Token {
    const start = this.index;
    this.index += 1;

    while (this.isIdentifierPart(this.input[this.index])) {
      this.index += 1;
    }

    const raw = this.input.slice(start, this.index);
    const normalized = raw.toLowerCase();

    if (normalized === 'and') {
      return { kind: 'and', value: raw, position: start };
    }

    if (normalized === 'or') {
      return { kind: 'or', value: raw, position: start };
    }

    if (normalized === 'not') {
      return { kind: 'not', value: raw, position: start };
    }

    if (normalized === 'true' || normalized === 'false') {
      return { kind: 'boolean', value: normalized, position: start };
    }

    if (normalized === 'null') {
      return { kind: 'null', value: normalized, position: start };
    }

    return { kind: 'identifier', value: raw, position: start };
  }

  private skipWhitespace(): void {
    while (this.index < this.input.length && /\s/.test(this.input[this.index])) {
      this.index += 1;
    }
  }

  private peek(offset: number): string | undefined {
    return this.input[this.index + offset];
  }

  private isDigit(char: string | undefined): boolean {
    return typeof char === 'string' && char >= '0' && char <= '9';
  }

  private isIdentifierStart(char: string | undefined): boolean {
    return typeof char === 'string' && /[A-Za-z_]/.test(char);
  }

  private isIdentifierPart(char: string | undefined): boolean {
    return typeof char === 'string' && /[A-Za-z0-9_.]/.test(char);
  }
}

class Parser {
  private current: Token;

  constructor(private readonly tokenizer: Tokenizer) {
    this.current = tokenizer.nextToken();
  }

  parse(): FilterAst {
    const firstToken = this.current;
    if (firstToken.kind === 'eof') {
      throw new FilterSyntaxError('Filter cannot be empty.');
    }

    const expression = this.parseOrExpression();

    if (this.current.kind !== 'eof') {
      throw new FilterSyntaxError(
        `Unexpected token "${this.current.value}" at position ${this.current.position}.`,
      );
    }

    return expression;
  }

  private parseOrExpression(): FilterAst {
    let node = this.parseAndExpression();

    while (this.current.kind === 'or') {
      this.advance();
      const right = this.parseAndExpression();
      node = { type: 'or', left: node, right };
    }

    return node;
  }

  private parseAndExpression(): FilterAst {
    let node = this.parseUnaryExpression();

    while (this.current.kind === 'and') {
      this.advance();
      const right = this.parseUnaryExpression();
      node = { type: 'and', left: node, right };
    }

    return node;
  }

  private parseUnaryExpression(): FilterAst {
    if (this.current.kind === 'not') {
      this.advance();
      return { type: 'not', operand: this.parseUnaryExpression() };
    }

    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): FilterAst {
    if (this.current.kind === 'lparen') {
      this.advance();
      const inner = this.parseOrExpression();
      this.expect('rparen', 'Expected closing ")".');
      this.advance();
      return inner;
    }

    return this.parseComparison();
  }

  private parseComparison(): FilterAst {
    const fieldToken = this.expect('identifier', 'Expected field name in comparison expression.');
    this.advance();

    const operatorToken = this.expect('operator', 'Expected operator after field name.');
    const operator = operatorToken.value as ComparisonOperator;

    if (!['=', '!=', '>', '>=', '<', '<=', ':'].includes(operator)) {
      throw new FilterSyntaxError(
        `Unsupported operator "${operator}" at position ${operatorToken.position}.`,
      );
    }

    this.advance();
    const value = this.parseValue();

    return {
      type: 'comparison',
      field: fieldToken.value,
      operator,
      value,
    };
  }

  private parseValue(): FilterValue {
    const token = this.current;

    if (token.kind === 'string') {
      this.advance();
      return token.value;
    }

    if (token.kind === 'number') {
      this.advance();
      const parsed = Number(token.value);
      if (!Number.isFinite(parsed)) {
        throw new FilterSyntaxError(`Invalid number "${token.value}" at position ${token.position}.`);
      }

      return parsed;
    }

    if (token.kind === 'boolean') {
      this.advance();
      return token.value === 'true';
    }

    if (token.kind === 'null') {
      this.advance();
      return null;
    }

    if (token.kind === 'identifier') {
      this.advance();
      return token.value;
    }

    throw new FilterSyntaxError(`Expected value at position ${token.position}.`);
  }

  private expect(kind: TokenKind, message: string): Token {
    if (this.current.kind !== kind) {
      throw new FilterSyntaxError(message);
    }

    return this.current;
  }

  private advance(): void {
    this.current = this.tokenizer.nextToken();
  }
}

export function parseFilter(input: string): FilterAst {
  const parser = new Parser(new Tokenizer(input));
  return parser.parse();
}
