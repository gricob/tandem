import {
  getReferencedFieldIds,
  hasCycle,
  mapConditionFieldIds,
} from './condition-tree';
import { ConditionNode } from './condition.types';

describe('getReferencedFieldIds', () => {
  it('returns an empty array for a null condition', () => {
    expect(getReferencedFieldIds(null)).toEqual([]);
  });

  it('collects field ids from nested groups', () => {
    const condition: ConditionNode = {
      op: 'AND',
      clauses: [
        { field: 'a', operator: 'equals', value: 'x' },
        { op: 'OR', clauses: [{ field: 'b', operator: 'is_empty' }] },
      ],
    };
    expect(getReferencedFieldIds(condition)).toEqual(['a', 'b']);
  });
});

describe('mapConditionFieldIds', () => {
  it('rewrites leaf field ids through the given map', () => {
    const condition: ConditionNode = {
      op: 'AND',
      clauses: [{ field: 'old-a', operator: 'equals', value: 'x' }],
    };
    const idMap = new Map([['old-a', 'new-a']]);

    expect(mapConditionFieldIds(condition, idMap)).toEqual({
      op: 'AND',
      clauses: [{ field: 'new-a', operator: 'equals', value: 'x' }],
    });
  });

  it('returns null for a null condition', () => {
    expect(mapConditionFieldIds(null, new Map())).toBeNull();
  });

  it('throws when a referenced field has no mapping', () => {
    const condition: ConditionNode = {
      field: 'unmapped',
      operator: 'equals',
      value: 'x',
    };
    expect(() => mapConditionFieldIds(condition, new Map())).toThrow();
  });
});

describe('hasCycle', () => {
  it('returns false when there are no conditions', () => {
    expect(
      hasCycle([
        { id: 'a', condition: null },
        { id: 'b', condition: null },
      ]),
    ).toBe(false);
  });

  it('returns false for a valid dependency chain', () => {
    expect(
      hasCycle([
        { id: 'a', condition: null },
        { id: 'b', condition: { field: 'a', operator: 'is_not_empty' } },
        { id: 'c', condition: { field: 'b', operator: 'is_not_empty' } },
      ]),
    ).toBe(false);
  });

  it('detects a direct cycle', () => {
    expect(
      hasCycle([
        { id: 'a', condition: { field: 'b', operator: 'is_not_empty' } },
        { id: 'b', condition: { field: 'a', operator: 'is_not_empty' } },
      ]),
    ).toBe(true);
  });

  it('detects a self-reference', () => {
    expect(
      hasCycle([
        { id: 'a', condition: { field: 'a', operator: 'is_not_empty' } },
      ]),
    ).toBe(true);
  });

  it('detects an indirect cycle through a chain', () => {
    expect(
      hasCycle([
        { id: 'a', condition: { field: 'c', operator: 'is_not_empty' } },
        { id: 'b', condition: { field: 'a', operator: 'is_not_empty' } },
        { id: 'c', condition: { field: 'b', operator: 'is_not_empty' } },
      ]),
    ).toBe(true);
  });
});
