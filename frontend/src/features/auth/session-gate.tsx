import type { ReactNode } from 'react';
import { PasswordScreen } from './password-screen';
import { useSessionToken } from './use-session-token';

export function SessionGate({ children }: { children: ReactNode }) {
  const token = useSessionToken();

  if (!token) {
    return <PasswordScreen />;
  }

  return children;
}
