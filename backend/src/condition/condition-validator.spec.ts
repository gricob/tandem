import { BadRequestException } from '@nestjs/common';
import { FormFieldType } from '@prisma/client';
import { validateCondition } from './condition-validator';
import { ConditionNode, FieldForCondition } from './condition.types';

describe('validateCondition', () => {
  const triggerText: FieldForCondition = {
    id: 'trigger',
    fieldType: FormFieldType.text,
    options: null,
  };
  const triggerSelect: FieldForCondition = {
    id: 'trigger-select',
    fieldType: FormFieldType.select,
    options: ['low', 'high'],
  };

  it('does nothing for a null condition', () => {
    expect(() => validateCondition(null, [])).not.toThrow();
  });

  it('accepts a valid leaf condition', () => {
    const condition: ConditionNode = {
      field: 'trigger',
      operator: 'equals',
      value: 'yes',
    };
    expect(() => validateCondition(condition, [triggerText])).not.toThrow();
  });

  it('accepts nested AND/OR groups', () => {
    const condition: ConditionNode = {
      op: 'AND',
      clauses: [
        { field: 'trigger', operator: 'is_not_empty' },
        {
          op: 'OR',
          clauses: [
            { field: 'trigger-select', operator: 'equals', value: 'low' },
          ],
        },
      ],
    };
    expect(() =>
      validateCondition(condition, [triggerText, triggerSelect]),
    ).not.toThrow();
  });

  it('rejects a reference to a field outside the given field set', () => {
    const condition: ConditionNode = {
      field: 'unknown',
      operator: 'equals',
      value: 'yes',
    };
    expect(() => validateCondition(condition, [triggerText])).toThrow(
      BadRequestException,
    );
  });

  it('rejects an operator invalid for the referenced field type', () => {
    const condition: ConditionNode = {
      field: 'trigger',
      operator: 'gt',
      value: 5,
    };
    expect(() => validateCondition(condition, [triggerText])).toThrow(
      BadRequestException,
    );
  });

  it('rejects a select value not among the referenced field options', () => {
    const condition: ConditionNode = {
      field: 'trigger-select',
      operator: 'equals',
      value: 'medium',
    };
    expect(() => validateCondition(condition, [triggerSelect])).toThrow(
      BadRequestException,
    );
  });

  it('rejects an empty clause group', () => {
    const condition: ConditionNode = { op: 'AND', clauses: [] };
    expect(() => validateCondition(condition, [triggerText])).toThrow(
      BadRequestException,
    );
  });

  it('does not require a value for is_empty/is_not_empty operators', () => {
    const condition: ConditionNode = { field: 'trigger', operator: 'is_empty' };
    expect(() => validateCondition(condition, [triggerText])).not.toThrow();
  });
});
