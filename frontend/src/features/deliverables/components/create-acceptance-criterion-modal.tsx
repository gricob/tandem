import { Button, Group, Modal, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useFormTemplates } from '../../form-templates/queries';
import {
  createAcceptanceCriterionSchema,
  type CreateAcceptanceCriterionFormValues,
} from '../schemas';

interface CreateAcceptanceCriterionModalProps {
  opened: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateAcceptanceCriterionFormValues) => void;
}

export function CreateAcceptanceCriterionModal({
  opened,
  submitting,
  onClose,
  onSubmit,
}: CreateAcceptanceCriterionModalProps) {
  const { data: formTemplates } = useFormTemplates();

  const form = useForm<CreateAcceptanceCriterionFormValues>({
    initialValues: { formTemplateId: '' },
    validate: zod4Resolver(createAcceptanceCriterionSchema),
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="New acceptance criterion"
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
