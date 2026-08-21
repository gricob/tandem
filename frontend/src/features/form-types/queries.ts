import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { FormType } from './api';

const formTypesKey = ['form-types'] as const;
const formTypeKey = (formTypeId: string) => ['form-types', formTypeId] as const;

export function useFormTypes() {
  return useQuery({ queryKey: formTypesKey, queryFn: api.listFormTypes });
}

export function useFormType(formTypeId: string) {
  return useQuery({
    queryKey: formTypeKey(formTypeId),
    queryFn: () => api.getFormType(formTypeId),
  });
}

export function useCreateFormType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createFormType,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formTypesKey });
    },
  });
}

export function useUpdateFormType(formTypeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updateFormType>[1]) =>
      api.updateFormType(formTypeId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(formTypeKey(formTypeId), data);
      void queryClient.invalidateQueries({ queryKey: formTypesKey });
    },
  });
}

export function useDeleteFormType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteFormType,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formTypesKey });
    },
  });
}

export function useAddField(formTypeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.addField>[1]) =>
      api.addField(formTypeId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formTypeKey(formTypeId) });
    },
  });
}

export function useUpdateField(formTypeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fieldId,
      body,
    }: {
      fieldId: string;
      body: Parameters<typeof api.updateField>[2];
    }) => api.updateField(formTypeId, fieldId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formTypeKey(formTypeId) });
    },
  });
}

export function useRemoveField(formTypeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) => api.removeField(formTypeId, fieldId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formTypeKey(formTypeId) });
    },
  });
}

export function useReorderFields(formTypeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldIds: string[]) => api.reorderFields(formTypeId, fieldIds),
    onMutate: async (fieldIds) => {
      await queryClient.cancelQueries({ queryKey: formTypeKey(formTypeId) });
      const previous = queryClient.getQueryData<FormType>(
        formTypeKey(formTypeId),
      );
      if (previous) {
        const fieldsById = new Map(
          previous.fields.map((field) => [field.id, field]),
        );
        const reordered = fieldIds
          .map((id, index) => {
            const field = fieldsById.get(id);
            return field ? { ...field, orderIndex: index } : null;
          })
          .filter((field) => field !== null);
        queryClient.setQueryData(formTypeKey(formTypeId), {
          ...previous,
          fields: reordered,
        });
      }
      return { previous };
    },
    onError: (_error, _fieldIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(formTypeKey(formTypeId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: formTypeKey(formTypeId) });
    },
  });
}
