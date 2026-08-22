import { ConditionNode, isConditionGroup } from './condition.types';

export function getReferencedFieldIds(
  condition: ConditionNode | null | undefined,
): string[] {
  if (condition == null) {
    return [];
  }
  const ids: string[] = [];
  const walk = (node: ConditionNode): void => {
    if (isConditionGroup(node)) {
      node.clauses.forEach(walk);
    } else {
      ids.push(node.field);
    }
  };
  walk(condition);
  return ids;
}

export function mapConditionFieldIds(
  condition: ConditionNode | null | undefined,
  idMap: Map<string, string>,
): ConditionNode | null {
  if (condition == null) {
    return null;
  }
  const walk = (node: ConditionNode): ConditionNode => {
    if (isConditionGroup(node)) {
      return { op: node.op, clauses: node.clauses.map(walk) };
    }
    const mappedFieldId = idMap.get(node.field);
    if (!mappedFieldId) {
      throw new Error(`No id mapping found for field ${node.field}.`);
    }
    return { field: mappedFieldId, operator: node.operator, value: node.value };
  };
  return walk(condition);
}

export function hasCycle(
  fields: { id: string; condition: ConditionNode | null | undefined }[],
): boolean {
  const adjacency = new Map(
    fields.map((field) => [field.id, getReferencedFieldIds(field.condition)]),
  );
  const state = new Map<string, 'visiting' | 'done'>();

  function visit(id: string): boolean {
    const status = state.get(id);
    if (status === 'visiting') {
      return true;
    }
    if (status === 'done') {
      return false;
    }
    state.set(id, 'visiting');
    for (const referencedId of adjacency.get(id) ?? []) {
      if (visit(referencedId)) {
        return true;
      }
    }
    state.set(id, 'done');
    return false;
  }

  return fields.some((field) => visit(field.id));
}
