import type { FormField } from '../form-types/api';

export type ResponseValues = Record<string, unknown>;

export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((value, index) => value === b[index])
    );
  }
  return a === b;
}

export function buildInitialValues(
  fields: FormField[],
  responseData: ResponseValues,
): ResponseValues {
  const values: ResponseValues = {};
  for (const field of fields) {
    const value = responseData[field.id];
    if (field.fieldType === 'multi_select') {
      values[field.id] = Array.isArray(value) ? value : [];
    } else if (field.fieldType === 'boolean') {
      values[field.id] = typeof value === 'boolean' ? value : false;
    } else if (field.fieldType === 'number') {
      values[field.id] = typeof value === 'number' ? value : '';
    } else {
      values[field.id] = typeof value === 'string' ? value : '';
    }
  }
  return values;
}

/** Diffs form values against the last saved response, normalizing empty inputs to `null` so they clear the field. */
export function buildChangedResponseData(
  current: ResponseValues,
  saved: ResponseValues,
): ResponseValues {
  const changed: ResponseValues = {};
  for (const [fieldId, rawValue] of Object.entries(current)) {
    const value = isEmptyValue(rawValue) ? null : rawValue;
    const previous = saved[fieldId] ?? null;
    if (!valuesEqual(value, previous)) {
      changed[fieldId] = value;
    }
  }
  return changed;
}

export function formatValueForDisplay(
  field: FormField,
  value: unknown,
): string {
  if (field.fieldType === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}
