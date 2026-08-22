import { apiFetch, type ApiPaths } from '../../api/client';

export type Deliverable =
  ApiPaths['/api/v1/deliverables']['get']['responses'][200]['content']['application/json'][number];

type CreateDeliverableBody =
  ApiPaths['/api/v1/deliverables']['post']['requestBody']['content']['application/json'];
type UpdateDeliverableBody =
  ApiPaths['/api/v1/deliverables/{deliverableId}']['patch']['requestBody']['content']['application/json'];

export function listDeliverables(): Promise<Deliverable[]> {
  return apiFetch('/api/v1/deliverables');
}

export function getDeliverable(deliverableId: string): Promise<Deliverable> {
  return apiFetch(`/api/v1/deliverables/${deliverableId}`);
}

export function createDeliverable(
  body: CreateDeliverableBody,
): Promise<Deliverable> {
  return apiFetch('/api/v1/deliverables', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateDeliverable(
  deliverableId: string,
  body: UpdateDeliverableBody,
): Promise<Deliverable> {
  return apiFetch(`/api/v1/deliverables/${deliverableId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteDeliverable(deliverableId: string): Promise<void> {
  return apiFetch(`/api/v1/deliverables/${deliverableId}`, {
    method: 'DELETE',
  });
}
