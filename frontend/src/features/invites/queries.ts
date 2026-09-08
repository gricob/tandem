import { useMutation } from '@tanstack/react-query';
import * as api from './api';

export function useCreateInvite() {
  return useMutation({
    mutationFn: api.createInvite,
  });
}
