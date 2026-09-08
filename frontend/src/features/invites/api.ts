import { apiFetch, type ApiPaths } from '../../api/client';

export type Invite =
  ApiPaths['/api/v1/invites']['post']['responses'][201]['content']['application/json'];

type CreateInviteBody =
  ApiPaths['/api/v1/invites']['post']['requestBody']['content']['application/json'];

export function createInvite(body: CreateInviteBody): Promise<Invite> {
  return apiFetch('/api/v1/invites', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
