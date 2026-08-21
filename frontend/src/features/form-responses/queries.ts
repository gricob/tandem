import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

const formResponseKey = (formId: string) => ['form-responses', formId] as const;

export function useFormResponse(formId: string) {
  return useQuery({
    queryKey: formResponseKey(formId),
    queryFn: () => api.getFormResponse(formId),
  });
}

export function useSaveFormResponse(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (responseData: Record<string, unknown>) =>
      api.saveFormResponse(formId, { responseData }),
    onSuccess: (data) => {
      queryClient.setQueryData(formResponseKey(formId), data);
    },
  });
}
