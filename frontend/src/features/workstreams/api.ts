import { apiFetch, type ApiPaths } from '../../api/client';
import { deleteDeliverable, type Deliverable } from '../deliverables/api';

export type Workstream =
  ApiPaths['/api/v1/workstreams']['get']['responses'][200]['content']['application/json'][number];

type CreateWorkstreamBody =
  ApiPaths['/api/v1/workstreams']['post']['requestBody']['content']['application/json'];
type UpdateWorkstreamBody =
  ApiPaths['/api/v1/workstreams/{workstreamId}']['patch']['requestBody']['content']['application/json'];
type CreateDeliverableBody =
  ApiPaths['/api/v1/workstreams/{workstreamId}/deliverables']['post']['requestBody']['content']['application/json'];

export function listWorkstreams(): Promise<Workstream[]> {
  return apiFetch('/api/v1/workstreams');
}

export function getWorkstream(workstreamId: string): Promise<Workstream> {
  return apiFetch(`/api/v1/workstreams/${workstreamId}`);
}

export function createWorkstream(
  body: CreateWorkstreamBody,
): Promise<Workstream> {
  return apiFetch('/api/v1/workstreams', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateWorkstream(
  workstreamId: string,
  body: UpdateWorkstreamBody,
): Promise<Workstream> {
  return apiFetch(`/api/v1/workstreams/${workstreamId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteWorkstream(workstreamId: string): Promise<void> {
  return apiFetch(`/api/v1/workstreams/${workstreamId}`, {
    method: 'DELETE',
  });
}

export function addDeliverable(
  workstreamId: string,
  body: CreateDeliverableBody,
): Promise<Deliverable> {
  return apiFetch(`/api/v1/workstreams/${workstreamId}/deliverables`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function removeDeliverable(deliverableId: string): Promise<void> {
  return deleteDeliverable(deliverableId);
}

export function reorderDeliverables(
  workstreamId: string,
  deliverableIds: string[],
): Promise<Deliverable[]> {
  return apiFetch(`/api/v1/workstreams/${workstreamId}/deliverables/order`, {
    method: 'PUT',
    body: JSON.stringify({ deliverableIds }),
  });
}
