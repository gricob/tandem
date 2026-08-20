const STORAGE_KEY = 'tandem.sessionToken';

type Listener = () => void;

const listeners = new Set<Listener>();

export function getSessionToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setSessionToken(token: string): void {
  window.localStorage.setItem(STORAGE_KEY, token);
  notify();
}

export function clearSessionToken(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  notify();
}

export function subscribeToSessionToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}
