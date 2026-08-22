import {
  ConditionNode,
  ConditionOperator,
  isConditionGroup,
} from './condition.types';

export interface EvaluableField {
  id: string;
  condition: ConditionNode | null | undefined;
}

const ABSENT = Symbol('absent');

/**
 * Resolves visibility for every field, given the fields' conditions and the
 * current response data. A field with no condition is always visible. A
 * hidden field's value is treated as absent by any condition that reads it,
 * so hidden-ness propagates through chains of dependent conditions.
 *
 * Assumes the reference graph is acyclic (enforced at write time).
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
    // Guard against a cycle slipping through (shouldn't happen; write-time
    // validation rejects cycles) by marking visiting fields hidden.
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
