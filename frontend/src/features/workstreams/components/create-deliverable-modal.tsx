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
import {
  createDeliverableSchema,
  type CreateDeliverableFormValues,
} from '../schemas';

interface CreateDeliverableModalProps {
  opened: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateDeliverableFormValues) => void;
}

export function CreateDeliverableModal({
  opened,
  submitting,
  onClose,
  onSubmit,
}: CreateDeliverableModalProps) {
  const form = useForm<CreateDeliverableFormValues>({
    initialValues: { name: '', description: '' },
    validate: zod4Resolver(createDeliverableSchema),
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="New deliverable" centered>
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
