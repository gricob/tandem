import { FormFieldType } from '@prisma/client';

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
  FormFieldType,
  ConditionOperator[]
> = {
  [FormFieldType.text]: [
    'equals',
    'not_equals',
    'contains',
    'is_empty',
    'is_not_empty',
  ],
  [FormFieldType.textarea]: [
    'equals',
    'not_equals',
    'contains',
    'is_empty',
    'is_not_empty',
  ],
  [FormFieldType.number]: [
    'equals',
    'not_equals',
    'gt',
    'gte',
    'lt',
    'lte',
    'is_empty',
    'is_not_empty',
  ],
  [FormFieldType.boolean]: ['equals'],
  [FormFieldType.select]: ['equals', 'not_equals'],
  [FormFieldType.multi_select]: [
    'contains',
    'not_contains',
    'is_empty',
    'is_not_empty',
  ],
  [FormFieldType.date]: [
    'equals',
    'before',
    'after',
    'is_empty',
    'is_not_empty',
  ],
};

export interface FieldForCondition {
  id: string;
  fieldType: FormFieldType;
  options: string[] | null;
}
