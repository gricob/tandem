import { BadRequestException } from '@nestjs/common';
import { FormFieldType } from '@prisma/client';
import {
  ConditionLeaf,
  ConditionNode,
  FieldForCondition,
  OPERATORS_BY_FIELD_TYPE,
  isConditionGroup,
} from './condition.types';

export function validateCondition(
  condition: ConditionNode | null | undefined,
  fields: FieldForCondition[],
): void {
  if (condition == null) {
    return;
  }
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  walk(condition, fieldsById);
}

function walk(
  node: ConditionNode,
  fieldsById: Map<string, FieldForCondition>,
): void {
  if (isConditionGroup(node)) {
    if (!Array.isArray(node.clauses) || node.clauses.length === 0) {
      throw new BadRequestException(
        'A condition group must have at least one clause.',
      );
    }
    node.clauses.forEach((clause) => walk(clause, fieldsById));
    return;
  }
  validateLeaf(node, fieldsById);
}

function validateLeaf(
  leaf: ConditionLeaf,
  fieldsById: Map<string, FieldForCondition>,
): void {
  const field = fieldsById.get(leaf.field);
  if (!field) {
    throw new BadRequestException(
      `Condition references field ${leaf.field}, which does not belong to this form template.`,
    );
  }

  const allowedOperators = OPERATORS_BY_FIELD_TYPE[field.fieldType];
  if (!allowedOperators.includes(leaf.operator)) {
    throw new BadRequestException(
      `Operator "${leaf.operator}" is not valid for field ${leaf.field} (type ${field.fieldType}).`,
    );
  }

  validateValueShape(field, leaf.operator, leaf.value);
}

function validateValueShape(
  field: FieldForCondition,
  operator: string,
  value: unknown,
): void {
  if (operator === 'is_empty' || operator === 'is_not_empty') {
    return;
  }

  switch (field.fieldType) {
    case FormFieldType.text:
    case FormFieldType.textarea:
      if (typeof value !== 'string') {
        throw new BadRequestException(
          `Condition value for field ${field.id} must be a string.`,
        );
      }
      return;
    case FormFieldType.number:
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new BadRequestException(
          `Condition value for field ${field.id} must be a number.`,
        );
      }
      return;
    case FormFieldType.boolean:
      if (typeof value !== 'boolean') {
        throw new BadRequestException(
          `Condition value for field ${field.id} must be a boolean.`,
        );
      }
      return;
    case FormFieldType.select: {
      const options = field.options ?? [];
      if (typeof value !== 'string' || !options.includes(value)) {
        throw new BadRequestException(
          `Condition value for field ${field.id} must be one of its options.`,
        );
      }
      return;
    }
    case FormFieldType.multi_select: {
      const options = field.options ?? [];
      if (typeof value !== 'string' || !options.includes(value)) {
        throw new BadRequestException(
          `Condition value for field ${field.id} must be one of its options.`,
        );
      }
      return;
    }
    case FormFieldType.date:
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        throw new BadRequestException(
          `Condition value for field ${field.id} must be an ISO date string.`,
        );
      }
      return;
  }
}
