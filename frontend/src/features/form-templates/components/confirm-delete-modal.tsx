import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';

interface ConfirmDeleteModalProps {
  opened: boolean;
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  opened,
  title,
  description,
  loading,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal opened={opened} onClose={onCancel} title={title} centered>
      <Stack gap="sm">
        <Text size="sm">{description}</Text>
        {error && (
          <Alert color="red" title="Can't delete">
            {error}
          </Alert>
        )}
      </Stack>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button color="red" loading={loading} onClick={onConfirm}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}
