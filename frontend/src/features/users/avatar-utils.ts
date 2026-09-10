import type { CurrentUser } from './api';

const AVATAR_COLORS = [
  '#0A84FF',
  '#BF5AF2',
  '#FF375F',
  '#30D158',
  '#FF9F0A',
  '#64D2FF',
  '#5E5CE6',
] as const;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function roleLabel(role: CurrentUser['role']): string {
  return role === 'admin' ? 'Admin' : 'Member';
}
