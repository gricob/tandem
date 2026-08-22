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
import {
  createUserStorySchema,
  type CreateUserStoryFormValues,
} from '../schemas';

interface CreateUserStoryModalProps {
  opened: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateUserStoryFormValues) => void;
}

export function CreateUserStoryModal({
  opened,
  submitting,
  onClose,
  onSubmit,
}: CreateUserStoryModalProps) {
  const { data: formTemplates } = useFormTemplates();

  const form = useForm<CreateUserStoryFormValues>({
    initialValues: { formTemplateId: '', name: '', description: '' },
    validate: zod4Resolver(createUserStorySchema),
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="New user story"
      centered
    >
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
          <TextInput label="Name" required {...form.getInputProps('name')} />
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
