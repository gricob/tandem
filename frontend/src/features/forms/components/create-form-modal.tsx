import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useFormTemplates } from '../../form-templates/queries';
import { createFormSchema, type CreateFormFormValues } from '../schemas';

interface CreateFormModalProps {
  opened: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateFormFormValues) => void;
}

export function CreateFormModal({
  opened,
  submitting,
  onClose,
  onSubmit,
}: CreateFormModalProps) {
  const { data: formTemplates } = useFormTemplates();

  const form = useForm<CreateFormFormValues>({
    initialValues: { formTemplateId: '', name: '', description: '' },
    validate: zod4Resolver(createFormSchema),
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="New form" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="sm">
          <Select
            label="Form template"
            placeholder="Select a form template"
            required
            data={(formTemplates ?? []).map((formTemplate) => ({
              value: formTemplate.id,
              label: formTemplate.name,
            }))}
            {...form.getInputProps('formTemplateId')}
          />
          <TextInput
            label="Name"
            required
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
