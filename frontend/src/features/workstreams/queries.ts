import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

const workstreamsKey = ['workstreams'] as const;
const workstreamKey = (workstreamId: string) =>
  ['workstreams', workstreamId] as const;

export function useWorkstreams() {
  return useQuery({
    queryKey: workstreamsKey,
    queryFn: api.listWorkstreams,
  });
}

export function useWorkstream(
  workstreamId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: workstreamKey(workstreamId),
    queryFn: () => api.getWorkstream(workstreamId),
    enabled: options?.enabled,
  });
}

export function useCreateWorkstream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createWorkstream,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workstreamsKey });
    },
  });
}

export function useUpdateWorkstream(workstreamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updateWorkstream>[1]) =>
      api.updateWorkstream(workstreamId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(workstreamKey(workstreamId), data);
      void queryClient.invalidateQueries({ queryKey: workstreamsKey });
    },
  });
}

export function useDeleteWorkstream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteWorkstream,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workstreamsKey });
    },
  });
}

export function useAddDeliverable(workstreamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.addDeliverable>[1]) =>
      api.addDeliverable(workstreamId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workstreamKey(workstreamId),
      });
    },
  });
}

export function useRemoveDeliverable(workstreamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.removeDeliverable,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workstreamKey(workstreamId),
      });
    },
  });
}

export function useReorderDeliverables(workstreamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliverableIds: string[]) =>
      api.reorderDeliverables(workstreamId, deliverableIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workstreamKey(workstreamId),
      });
    },
  });
}
