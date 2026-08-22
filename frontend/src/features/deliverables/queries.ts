import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

const deliverablesKey = ['deliverables'] as const;
const deliverableKey = (deliverableId: string) =>
  ['deliverables', deliverableId] as const;

export function useDeliverables() {
  return useQuery({
    queryKey: deliverablesKey,
    queryFn: api.listDeliverables,
  });
}

export function useDeliverable(
  deliverableId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: deliverableKey(deliverableId),
    queryFn: () => api.getDeliverable(deliverableId),
    enabled: options?.enabled,
  });
}

export function useCreateDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDeliverable,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: deliverablesKey });
    },
  });
}

export function useUpdateDeliverable(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updateDeliverable>[1]) =>
      api.updateDeliverable(deliverableId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(deliverableKey(deliverableId), data);
      void queryClient.invalidateQueries({ queryKey: deliverablesKey });
    },
  });
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteDeliverable,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: deliverablesKey });
    },
  });
}
