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

export function useAddUserStory(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.addUserStory>[1]) =>
      api.addUserStory(deliverableId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: deliverableKey(deliverableId),
      });
    },
  });
}

export function useRemoveUserStory(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userStoryId: string) =>
      api.removeUserStory(deliverableId, userStoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: deliverableKey(deliverableId),
      });
    },
  });
}

export function useReorderUserStories(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userStoryIds: string[]) =>
      api.reorderUserStories(deliverableId, userStoryIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: deliverableKey(deliverableId),
      });
    },
  });
}

export function useAddAcceptanceCriterion(
  deliverableId: string,
  userStoryId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.addAcceptanceCriterion>[1]) =>
      api.addAcceptanceCriterion(userStoryId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: deliverableKey(deliverableId),
      });
    },
  });
}

export function useRemoveAcceptanceCriterion(
  deliverableId: string,
  userStoryId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (acceptanceCriterionId: string) =>
      api.removeAcceptanceCriterion(userStoryId, acceptanceCriterionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: deliverableKey(deliverableId),
      });
    },
  });
}

export function useReorderAcceptanceCriteria(
  deliverableId: string,
  userStoryId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (acceptanceCriteriaIds: string[]) =>
      api.reorderAcceptanceCriteria(userStoryId, acceptanceCriteriaIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: deliverableKey(deliverableId),
      });
    },
  });
}

export function useUpdateUserStoryDetails(
  deliverableId: string,
  userStoryId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updateFormDetails>[1]) =>
      api.updateFormDetails(userStoryId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: deliverableKey(deliverableId),
      });
    },
  });
}
