// Mirrors the backend's condition model (backend/src/condition/). Kept as a
// small, framework-free port since there's no shared package between the
// two workspaces - see conditional-fields/design.md Decision 4.

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'date';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'before'
  | 'after';

export interface ConditionLeaf {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface ConditionGroup {
  op: 'AND' | 'OR';
  clauses: ConditionNode[];
}

export type ConditionNode = ConditionGroup | ConditionLeaf;

export function isConditionGroup(node: ConditionNode): node is ConditionGroup {
  return (node as ConditionGroup).op !== undefined;
}

export const OPERATORS_BY_FIELD_TYPE: Record<
  FieldType,
  { value: ConditionOperator; label: string }[]
> = {
  text: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  textarea: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'gt', label: 'is greater than' },
    { value: 'gte', label: 'is at least' },
    { value: 'lt', label: 'is less than' },
    { value: 'lte', label: 'is at most' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  boolean: [{ value: 'equals', label: 'is' }],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
  multi_select: [
    { value: 'contains', label: 'includes' },
    { value: 'not_contains', label: 'does not include' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  date: [
    { value: 'equals', label: 'is' },
    { value: 'before', label: 'is before' },
    { value: 'after', label: 'is after' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
};

export function operatorTakesValue(operator: ConditionOperator): boolean {
  return operator !== 'is_empty' && operator !== 'is_not_empty';
}

export interface EvaluableField {
  id: string;
  condition: ConditionNode | null | undefined;
}

/**
 * Resolves visibility for every field, given the fields' conditions and the
 * current response/in-progress data. A field with no condition is always
 * visible. A hidden field's value is treated as absent by any condition that
 * reads it, so hidden-ness propagates through chains of dependent
 * conditions. Mirrors backend/src/condition/condition-evaluator.ts.
 */
export function resolveVisibility(
  fields: EvaluableField[],
  responseData: Record<string, unknown>,
): Map<string, boolean> {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const memo = new Map<string, boolean>();

  function isVisible(fieldId: string): boolean {
    const memoized = memo.get(fieldId);
    if (memoized !== undefined) {
      return memoized;
    }
    const field = fieldsById.get(fieldId);
    if (!field || field.condition == null) {
      memo.set(fieldId, true);
      return true;
    }
    memo.set(fieldId, false);
    const result = evaluate(field.condition);
    memo.set(fieldId, result);
    return result;
  }

  function effectiveValue(fieldId: string): unknown {
    if (!fieldsById.has(fieldId) || !isVisible(fieldId)) {
      return ABSENT;
    }
    const value = responseData[fieldId];
    return value === undefined ? ABSENT : value;
  }

  function evaluate(node: ConditionNode): boolean {
    if (isConditionGroup(node)) {
      if (node.clauses.length === 0) {
        return node.op === 'AND';
      }
      return node.op === 'AND'
        ? node.clauses.every(evaluate)
        : node.clauses.some(evaluate);
    }
    return evaluateLeaf(node.operator, effectiveValue(node.field), node.value);
  }

  function evaluateLeaf(
    operator: ConditionOperator,
    effective: unknown,
    expected: unknown,
  ): boolean {
    switch (operator) {
      case 'is_empty':
        return isEmpty(effective);
      case 'is_not_empty':
        return !isEmpty(effective);
      default:
        break;
    }
    if (effective === ABSENT || effective === null) {
      return false;
    }
    switch (operator) {
      case 'equals':
        return effective === expected;
      case 'not_equals':
        return effective !== expected;
      case 'contains':
        return Array.isArray(effective)
          ? effective.includes(expected)
          : typeof effective === 'string' &&
              typeof expected === 'string' &&
              effective.includes(expected);
      case 'not_contains':
        return Array.isArray(effective) ? !effective.includes(expected) : true;
      case 'gt':
        return (
          typeof effective === 'number' && effective > (expected as number)
        );
      case 'gte':
        return (
          typeof effective === 'number' && effective >= (expected as number)
        );
      case 'lt':
        return (
          typeof effective === 'number' && effective < (expected as number)
        );
      case 'lte':
        return (
          typeof effective === 'number' && effective <= (expected as number)
        );
      case 'before':
        return (
          typeof effective === 'string' &&
          typeof expected === 'string' &&
          Date.parse(effective) < Date.parse(expected)
        );
      case 'after':
        return (
          typeof effective === 'string' &&
          typeof expected === 'string' &&
          Date.parse(effective) > Date.parse(expected)
        );
      default:
        return false;
    }
  }

  function isEmpty(value: unknown): boolean {
    if (value === ABSENT || value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string') {
      return value.length === 0;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return false;
  }

  for (const field of fields) {
    isVisible(field.id);
  }
  return memo;
}

const ABSENT = Symbol('absent');
