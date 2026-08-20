import { useSyncExternalStore } from 'react';
import { getSessionToken, subscribeToSessionToken } from './session-store';

export function useSessionToken(): string | null {
  return useSyncExternalStore(subscribeToSessionToken, getSessionToken);
}
