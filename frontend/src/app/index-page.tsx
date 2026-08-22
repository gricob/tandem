import { Container, Text, Title } from '@mantine/core';

export function IndexPage() {
  return (
    <Container py="xl">
      <Title order={1}>Tandem</Title>
      <Text c="dimmed">
        Create configurable forms, share them, and review the responses you
        receive.
      </Text>
    </Container>
  );
}
