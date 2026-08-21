import { Button, Container, Group, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';

export function IndexPage() {
  return (
    <Container py="xl">
      <Title order={1}>Tandem</Title>
      <Text c="dimmed" mb="md">
        Create configurable forms, share them, and review the responses you
        receive.
      </Text>
      <Group>
        <Link to="/form-types">
          <Button component="span">Form types</Button>
        </Link>
        <Link to="/forms">
          <Button component="span" variant="default">
            Forms
          </Button>
        </Link>
      </Group>
    </Container>
  );
}
