import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

const formsKey = (name?: string) => ['forms', name ?? ''] as const;
const formKey = (formId: string) => ['forms', 'detail', formId] as const;

export function useForms(name?: string) {
  return useQuery({
    queryKey: formsKey(name),
    queryFn: () => api.listForms(name),
  });
}

export function useForm(formId: string) {
  return useQuery({
    queryKey: formKey(formId),
    queryFn: () => api.getForm(formId),
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createForm,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

export function useUpdateForm(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updateForm>[1]) =>
      api.updateForm(formId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(formKey(formId), data);
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteForm,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}
