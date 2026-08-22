import { resolveVisibility } from './condition-evaluator';
import { ConditionNode } from './condition.types';

describe('resolveVisibility', () => {
  it('treats a field with no condition as always visible', () => {
    const result = resolveVisibility([{ id: 'a', condition: null }], {});
    expect(result.get('a')).toBe(true);
  });

  it('evaluates a single equals condition', () => {
    const condition: ConditionNode = {
      field: 'trigger',
      operator: 'equals',
      value: 'yes',
    };
    const fields = [
      { id: 'trigger', condition: null },
      { id: 'dependent', condition },
    ];

    expect(resolveVisibility(fields, { trigger: 'yes' }).get('dependent')).toBe(
      true,
    );
    expect(resolveVisibility(fields, { trigger: 'no' }).get('dependent')).toBe(
      false,
    );
    expect(resolveVisibility(fields, {}).get('dependent')).toBe(false);
  });

  it('evaluates nested AND/OR groups', () => {
    const condition: ConditionNode = {
      op: 'AND',
      clauses: [
        { field: 'a', operator: 'equals', value: 'x' },
        {
          op: 'OR',
          clauses: [
            { field: 'b', operator: 'gt', value: 5 },
            { field: 'c', operator: 'is_not_empty' },
          ],
        },
      ],
    };
    const fields = [
      { id: 'a', condition: null },
      { id: 'b', condition: null },
      { id: 'c', condition: null },
      { id: 'dependent', condition },
    ];

    expect(resolveVisibility(fields, { a: 'x', b: 10 }).get('dependent')).toBe(
      true,
    );
    expect(
      resolveVisibility(fields, { a: 'x', b: 1, c: 'note' }).get('dependent'),
    ).toBe(true);
    expect(resolveVisibility(fields, { a: 'x', b: 1 }).get('dependent')).toBe(
      false,
    );
    expect(
      resolveVisibility(fields, { a: 'other', b: 10 }).get('dependent'),
    ).toBe(false);
  });

  it('propagates hidden-ness through a chain of conditional fields', () => {
    const fields = [
      { id: 'a', condition: null },
      {
        id: 'b',
        condition: {
          field: 'a',
          operator: 'equals',
          value: 'yes',
        } as ConditionNode,
      },
      {
        id: 'c',
        condition: {
          field: 'b',
          operator: 'equals',
          value: 'answered',
        } as ConditionNode,
      },
    ];

    // a !== 'yes' => b hidden => b's effective value is absent => c hidden too,
    // even though response_data has a stale value for b.
    const result = resolveVisibility(fields, { a: 'no', b: 'answered' });
    expect(result.get('b')).toBe(false);
    expect(result.get('c')).toBe(false);
  });

  it('shows a field once its transitive chain of triggers is satisfied', () => {
    const fields = [
      { id: 'a', condition: null },
      {
        id: 'b',
        condition: {
          field: 'a',
          operator: 'equals',
          value: 'yes',
        } as ConditionNode,
      },
      {
        id: 'c',
        condition: {
          field: 'b',
          operator: 'equals',
          value: 'answered',
        } as ConditionNode,
      },
    ];

    const result = resolveVisibility(fields, { a: 'yes', b: 'answered' });
    expect(result.get('b')).toBe(true);
    expect(result.get('c')).toBe(true);
  });

  it('treats an empty AND group as vacuously true and an empty OR group as false', () => {
    const fields = [
      {
        id: 'andField',
        condition: { op: 'AND', clauses: [] } as ConditionNode,
      },
      { id: 'orField', condition: { op: 'OR', clauses: [] } as ConditionNode },
    ];

    const result = resolveVisibility(fields, {});
    expect(result.get('andField')).toBe(true);
    expect(result.get('orField')).toBe(false);
  });
});
