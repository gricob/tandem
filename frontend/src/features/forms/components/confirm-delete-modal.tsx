import { Button, Group, Modal, Text } from '@mantine/core';

interface ConfirmDeleteModalProps {
  opened: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  opened,
  title,
  description,
  loading,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal opened={opened} onClose={onCancel} title={title} centered>
      <Text size="sm">{description}</Text>
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
