import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { FormTemplate } from './api';

const formTemplatesKey = ['form-templates'] as const;
const formTemplateKey = (formTemplateId: string) =>
  ['form-templates', formTemplateId] as const;

export function useFormTemplates() {
  return useQuery({
    queryKey: formTemplatesKey,
    queryFn: api.listFormTemplates,
  });
}

export function useFormTemplate(
  formTemplateId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: formTemplateKey(formTemplateId),
    queryFn: () => api.getFormTemplate(formTemplateId),
    enabled: options?.enabled,
  });
}

export function useCreateFormTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createFormTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formTemplatesKey });
    },
  });
}

export function useUpdateFormTemplate(formTemplateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updateFormTemplate>[1]) =>
      api.updateFormTemplate(formTemplateId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(formTemplateKey(formTemplateId), data);
      void queryClient.invalidateQueries({ queryKey: formTemplatesKey });
    },
  });
}

export function useDeleteFormTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteFormTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formTemplatesKey });
    },
  });
}

export function useAddField(formTemplateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.addField>[1]) =>
      api.addField(formTemplateId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: formTemplateKey(formTemplateId),
      });
    },
  });
}

export function useUpdateField(formTemplateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fieldId,
      body,
    }: {
      fieldId: string;
      body: Parameters<typeof api.updateField>[2];
    }) => api.updateField(formTemplateId, fieldId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: formTemplateKey(formTemplateId),
      });
    },
  });
}

export function useRemoveField(formTemplateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) => api.removeField(formTemplateId, fieldId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: formTemplateKey(formTemplateId),
      });
    },
  });
}

export function useReorderFields(formTemplateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldIds: string[]) =>
      api.reorderFields(formTemplateId, fieldIds),
    onMutate: async (fieldIds) => {
      await queryClient.cancelQueries({
        queryKey: formTemplateKey(formTemplateId),
      });
      const previous = queryClient.getQueryData<FormTemplate>(
        formTemplateKey(formTemplateId),
      );
      if (previous) {
        const fieldsById = new Map(
          previous.templateFields.map((field) => [field.id, field]),
        );
        const reordered = fieldIds
          .map((id, index) => {
            const field = fieldsById.get(id);
            return field ? { ...field, orderIndex: index } : null;
          })
          .filter((field) => field !== null);
        queryClient.setQueryData(formTemplateKey(formTemplateId), {
          ...previous,
          templateFields: reordered,
        });
      }
      return { previous };
    },
    onError: (_error, _fieldIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(formTemplateKey(formTemplateId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: formTemplateKey(formTemplateId),
      });
    },
  });
}
