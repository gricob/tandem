import type { ReactNode } from 'react';
import { LoginScreen } from './login-screen';
import { RegistrationScreen } from './registration-screen';
import { useSessionToken } from './use-session-token';

export function SessionGate({ children }: { children: ReactNode }) {
  const token = useSessionToken();

  if (!token) {
    if (window.location.pathname === '/register') {
      return <RegistrationScreen />;
    }
    return <LoginScreen />;
  }

  return children;
}
