import {
  Alert,
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Link, useParams } from '@tanstack/react-router';
import { resolveVisibility, type ConditionNode } from '../forms/condition';
import { useForm as useFormQuery } from '../forms/queries';
import { useFormResponse } from './queries';
import { formatValueForDisplay } from './value-utils';

export function FormResponseViewPage() {
  const { formId } = useParams({ from: '/forms/$formId/response' });
  const {
    data: form,
    isPending: formPending,
    isError: formError,
  } = useFormQuery(formId);
  const {
    data: response,
    isPending: responsePending,
    isError: responseError,
  } = useFormResponse(formId);

  if (formPending || responsePending) {
    return (
      <Container py="xl">
        <Text c="dimmed">Loading response…</Text>
      </Container>
    );
  }

  if (formError || responseError || !form) {
    return (
      <Container py="xl">
        <Alert color="red" title="Couldn't load response">
          Something went wrong. Try refreshing the page.
        </Alert>
      </Container>
    );
  }

  const visibility = resolveVisibility(
    form.fields.map((field) => ({
      id: field.id,
      condition: field.condition as ConditionNode | null,
    })),
    response?.responseData ?? {},
  );

  return (
    <Container py="xl">
      <Link to="/forms/$formId" params={{ formId }}>
        <Anchor component="span" size="sm">
          ← {form.name}
        </Anchor>
      </Link>

      <Title order={1} mt="xs" mb="lg">
        Response: {form.name}
      </Title>

      {!response ? (
        <Stack gap="sm" align="flex-start">
          <Text c="dimmed">No response has been saved for this form yet.</Text>
          <Link to="/forms/$formId/fill" params={{ formId }}>
            <Button component="span">Fill in form</Button>
          </Link>
        </Stack>
      ) : (
        <Stack gap="md" maw={480}>
          <Group>
            <Badge color={response.isComplete ? 'green' : 'yellow'}>
              {response.isComplete ? 'Complete' : 'Incomplete'}
            </Badge>
          </Group>

          <Stack gap="sm">
            {form.fields
              .filter(
                (field) =>
                  visibility.get(field.id) &&
                  response.responseData[field.id] != null,
              )
              .map((field) => (
                <div key={field.id}>
                  <Text size="sm" fw={500}>
                    {field.label}
                  </Text>
                  <Text>
                    {formatValueForDisplay(
                      field,
                      response.responseData[field.id],
                    )}
                  </Text>
                </div>
              ))}
          </Stack>

          <Link to="/forms/$formId/fill" params={{ formId }}>
            <Button component="span" variant="default">
              Edit response
            </Button>
          </Link>
        </Stack>
      )}
    </Container>
  );
}
