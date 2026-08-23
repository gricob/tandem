import {
  Button,
  Group,
  Modal,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { workstreamSchema, type WorkstreamFormValues } from '../schemas';

interface CreateWorkstreamModalProps {
  opened: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: WorkstreamFormValues) => void;
}

export function CreateWorkstreamModal({
  opened,
  submitting,
  onClose,
  onSubmit,
}: CreateWorkstreamModalProps) {
  const form = useForm<WorkstreamFormValues>({
    initialValues: { name: '', description: '' },
    validate: zod4Resolver(workstreamSchema),
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="New workstream" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Name"
            required
            autoFocus
            {...form.getInputProps('name')}
          />
          <Textarea
            label="Description"
            {...form.getInputProps('description')}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
