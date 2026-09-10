import { Container, Text, Title } from '@mantine/core';

export function IndexPage() {
  return (
    <Container py="xl">
      <Title order={1}>Tandem</Title>
      <Text c="dimmed">
        Plan and track your team&apos;s workstreams and deliverables in one
        place.
      </Text>
    </Container>
  );
}
