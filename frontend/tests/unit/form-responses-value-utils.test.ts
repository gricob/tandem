import { describe, expect, it } from 'vitest';
import {
  buildChangedResponseData,
  buildInitialValues,
  isEmptyValue,
} from '../../src/features/form-responses/value-utils';
import type { FormField } from '../../src/features/form-types/api';

function makeField(overrides: Partial<FormField>): FormField {
  return {
    id: 'field-1',
    formTypeId: 'form-type-1',
    label: 'Field',
    fieldType: 'text',
    isRequired: false,
    options: null,
    orderIndex: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as FormField;
}

describe('isEmptyValue', () => {
  it('treats undefined, null, blank strings, and empty arrays as empty', () => {
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue('   ')).toBe(true);
    expect(isEmptyValue([])).toBe(true);
  });

  it('treats other values as non-empty', () => {
    expect(isEmptyValue('Alice')).toBe(false);
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
    expect(isEmptyValue(['Bug'])).toBe(false);
  });
});

describe('buildInitialValues', () => {
  it('pre-fills saved values and defaults unanswered fields per type', () => {
    const fields = [
      makeField({ id: 'name', fieldType: 'text' }),
      makeField({ id: 'count', fieldType: 'number' }),
      makeField({ id: 'agreed', fieldType: 'boolean' }),
      makeField({ id: 'tags', fieldType: 'multi_select' }),
    ];

    const values = buildInitialValues(fields, { name: 'Alice', count: 3 });

    expect(values).toEqual({
      name: 'Alice',
      count: 3,
      agreed: false,
      tags: [],
    });
  });
});

describe('buildChangedResponseData', () => {
  it('only includes fields whose value actually changed', () => {
    const changed = buildChangedResponseData(
      { name: 'Alice', severity: 'Low' },
      { name: 'Alice', severity: 'Low' },
    );

    expect(changed).toEqual({});
  });

  it('includes a newly answered field', () => {
    const changed = buildChangedResponseData(
      { name: 'Alice', severity: 'Low' },
      { name: 'Alice', severity: '' },
    );

    expect(changed).toEqual({ severity: 'Low' });
  });

  it('sends null to clear a field that became empty', () => {
    const changed = buildChangedResponseData(
      { name: 'Alice', severity: '' },
      { name: 'Alice', severity: 'Low' },
    );

    expect(changed).toEqual({ severity: null });
  });

  it('treats an unchanged array as equal, ignoring reference identity', () => {
    const changed = buildChangedResponseData(
      { tags: ['Bug', 'Feature'] },
      { tags: ['Bug', 'Feature'] },
    );

    expect(changed).toEqual({});
  });
});
