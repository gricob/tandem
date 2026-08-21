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
import { formTemplateSchema, type FormTemplateFormValues } from '../schemas';

interface CreateFormTemplateModalProps {
  opened: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: FormTemplateFormValues) => void;
}

export function CreateFormTemplateModal({
  opened,
  submitting,
  onClose,
  onSubmit,
}: CreateFormTemplateModalProps) {
  const form = useForm<FormTemplateFormValues>({
    initialValues: { name: '', description: '' },
    validate: zod4Resolver(formTemplateSchema),
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="New form template"
      centered
    >
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
