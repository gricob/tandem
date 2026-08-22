import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import {
  isConditionGroup,
  OPERATORS_BY_FIELD_TYPE,
  operatorTakesValue,
  type ConditionGroup,
  type ConditionLeaf,
  type ConditionNode,
  type ConditionOperator,
  type FieldType,
} from '../../forms/condition';

export interface AvailableConditionField {
  id: string;
  label: string;
  fieldType: FieldType;
  options: string[] | null;
}

interface ConditionBuilderProps {
  value: ConditionNode | null;
  onChange: (condition: ConditionNode | null) => void;
  availableFields: AvailableConditionField[];
}

export function ConditionBuilder({
  value,
  onChange,
  availableFields,
}: ConditionBuilderProps) {
  const enabled = value != null;

  function handleToggle(checked: boolean) {
    onChange(checked ? normalizeToGroup(value, availableFields) : null);
  }

  return (
    <Stack gap="xs">
      <Switch
        label="Only show this field when a condition is met"
        checked={enabled}
        disabled={availableFields.length === 0}
        onChange={(event) => handleToggle(event.currentTarget.checked)}
      />
      {availableFields.length === 0 && (
        <Text size="xs" c="dimmed">
          Add another field first to make this field conditional.
        </Text>
      )}
      {enabled && (
        <ConditionGroupEditor
          group={normalizeToGroup(value, availableFields)}
          availableFields={availableFields}
          onChange={onChange}
          depth={0}
        />
      )}
    </Stack>
  );
}

function normalizeToGroup(
  condition: ConditionNode | null | undefined,
  availableFields: AvailableConditionField[],
): ConditionGroup {
  if (!condition) {
    return defaultGroup(availableFields);
  }
  return isConditionGroup(condition)
    ? condition
    : { op: 'AND', clauses: [condition] };
}

function defaultLeaf(availableFields: AvailableConditionField[]): ConditionLeaf {
  const field = availableFields[0];
  const operator = OPERATORS_BY_FIELD_TYPE[field.fieldType][0].value;
  return {
    field: field.id,
    operator,
    value: defaultValueFor(field, operator),
  };
}

function defaultGroup(availableFields: AvailableConditionField[]): ConditionGroup {
  return { op: 'AND', clauses: [defaultLeaf(availableFields)] };
}

function defaultValueFor(
  field: AvailableConditionField,
  operator: ConditionOperator,
): unknown {
  if (!operatorTakesValue(operator)) {
    return undefined;
  }
  switch (field.fieldType) {
    case 'boolean':
      return true;
    case 'number':
      return 0;
    case 'select':
    case 'multi_select':
      return field.options?.[0] ?? '';
    default:
      return '';
  }
}

interface ConditionGroupEditorProps {
  group: ConditionGroup;
  availableFields: AvailableConditionField[];
  onChange: (node: ConditionNode) => void;
  onRemove?: () => void;
  depth: number;
}

function ConditionGroupEditor({
  group,
  availableFields,
  onChange,
  onRemove,
  depth,
}: ConditionGroupEditorProps) {
  function updateClause(index: number, next: ConditionNode) {
    const clauses = group.clauses.map((clause, i) =>
      i === index ? next : clause,
    );
    onChange({ ...group, clauses });
  }

  function removeClause(index: number) {
    onChange({
      ...group,
      clauses: group.clauses.filter((_, i) => i !== index),
    });
  }

  function addClause() {
    onChange({
      ...group,
      clauses: [...group.clauses, defaultLeaf(availableFields)],
    });
  }

  function addGroup() {
    onChange({
      ...group,
      clauses: [...group.clauses, defaultGroup(availableFields)],
    });
  }

  return (
    <Paper withBorder p="sm" bg={depth > 0 ? 'var(--mantine-color-gray-0)' : undefined}>
      <Stack gap="xs">
        <Group justify="space-between">
          <SegmentedControl
            size="xs"
            value={group.op}
            onChange={(op) => onChange({ ...group, op: op as 'AND' | 'OR' })}
            data={[
              { label: 'All (AND)', value: 'AND' },
              { label: 'Any (OR)', value: 'OR' },
            ]}
          />
          {onRemove && (
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={onRemove}
              aria-label="Remove group"
            >
              🗑
            </ActionIcon>
          )}
        </Group>

        {group.clauses.map((clause, index) =>
          isConditionGroup(clause) ? (
            <ConditionGroupEditor
              key={index}
              group={clause}
              availableFields={availableFields}
              onChange={(next) => updateClause(index, next)}
              onRemove={() => removeClause(index)}
              depth={depth + 1}
            />
          ) : (
            <ClauseEditor
              key={index}
              clause={clause}
              availableFields={availableFields}
              onChange={(next) => updateClause(index, next)}
              onRemove={() => removeClause(index)}
            />
          ),
        )}

        <Group gap="xs">
          <Button size="xs" variant="light" onClick={addClause}>
            + Condition
          </Button>
          <Button size="xs" variant="subtle" onClick={addGroup}>
            + Group
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

interface ClauseEditorProps {
  clause: ConditionLeaf;
  availableFields: AvailableConditionField[];
  onChange: (clause: ConditionLeaf) => void;
  onRemove: () => void;
}

function ClauseEditor({
  clause,
  availableFields,
  onChange,
  onRemove,
}: ClauseEditorProps) {
  const field =
    availableFields.find((candidate) => candidate.id === clause.field) ??
    availableFields[0];
  const operators = OPERATORS_BY_FIELD_TYPE[field.fieldType];

  function handleFieldChange(fieldId: string | null) {
    const nextField = availableFields.find(
      (candidate) => candidate.id === fieldId,
    );
    if (!nextField) {
      return;
    }
    const operator = OPERATORS_BY_FIELD_TYPE[nextField.fieldType][0].value;
    onChange({
      field: nextField.id,
      operator,
      value: defaultValueFor(nextField, operator),
    });
  }

  function handleOperatorChange(operator: string | null) {
    if (!operator) {
      return;
    }
    const nextOperator = operator as ConditionOperator;
    onChange({
      ...clause,
      operator: nextOperator,
      value: operatorTakesValue(nextOperator)
        ? defaultValueFor(field, nextOperator)
        : undefined,
    });
  }

  return (
    <Group gap="xs" wrap="wrap" align="flex-end">
      <Select
        label="Field"
        aria-label="Condition field"
        size="xs"
        w={160}
        data={availableFields.map((candidate) => ({
          value: candidate.id,
          label: candidate.label,
        }))}
        value={field.id}
        onChange={handleFieldChange}
        allowDeselect={false}
      />
      <Select
        label="Operator"
        aria-label="Condition operator"
        size="xs"
        w={150}
        data={operators.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        value={clause.operator}
        onChange={handleOperatorChange}
        allowDeselect={false}
      />
      {operatorTakesValue(clause.operator) && (
        <ClauseValueInput
          field={field}
          value={clause.value}
          onChange={(value) => onChange({ ...clause, value })}
        />
      )}
      <ActionIcon
        variant="subtle"
        color="red"
        onClick={onRemove}
        aria-label="Remove condition"
        mb={4}
      >
        🗑
      </ActionIcon>
    </Group>
  );
}

function ClauseValueInput({
  field,
  value,
  onChange,
}: {
  field: AvailableConditionField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.fieldType) {
    case 'boolean':
      return (
        <Select
          label="Value"
          aria-label="Condition value"
          size="xs"
          w={100}
          data={[
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ]}
          value={String(value ?? true)}
          onChange={(next) => onChange(next === 'true')}
          allowDeselect={false}
        />
      );
    case 'number':
      return (
        <NumberInput
          label="Value"
          aria-label="Condition value"
          size="xs"
          w={100}
          value={typeof value === 'number' ? value : undefined}
          onChange={(next) => onChange(typeof next === 'number' ? next : 0)}
        />
      );
    case 'select':
    case 'multi_select':
      return (
        <Select
          label="Value"
          aria-label="Condition value"
          size="xs"
          w={150}
          data={field.options ?? []}
          value={typeof value === 'string' ? value : null}
          onChange={(next) => next && onChange(next)}
          allowDeselect={false}
        />
      );
    case 'date':
      return (
        <TextInput
          type="date"
          label="Value"
          aria-label="Condition value"
          size="xs"
          w={150}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      );
    default:
      return (
        <TextInput
          label="Value"
          aria-label="Condition value"
          size="xs"
          w={150}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      );
  }
}
