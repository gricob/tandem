import { useQuery } from '@tanstack/react-query';
import { useSessionToken } from '../auth/use-session-token';
import { getCurrentUser } from './api';

export function useCurrentUser() {
  const token = useSessionToken();
  return useQuery({
    queryKey: ['currentUser', token],
    queryFn: getCurrentUser,
    enabled: token !== null,
    staleTime: Infinity,
  });
}
