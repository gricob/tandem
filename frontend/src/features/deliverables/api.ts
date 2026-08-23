import { apiFetch, type ApiPaths } from '../../api/client';

export type Deliverable =
  ApiPaths['/api/v1/deliverables/{deliverableId}']['get']['responses'][200]['content']['application/json'];
export type UserStory = Deliverable['userStories'][number];
export type AcceptanceCriterion = UserStory['acceptanceCriteria'][number];

type UpdateDeliverableBody =
  ApiPaths['/api/v1/deliverables/{deliverableId}']['patch']['requestBody']['content']['application/json'];

type CreateUserStoryBody =
  ApiPaths['/api/v1/deliverables/{deliverableId}/user-stories']['post']['requestBody']['content']['application/json'];
type CreateAcceptanceCriterionBody =
  ApiPaths['/api/v1/user-stories/{userStoryId}/acceptance-criteria']['post']['requestBody']['content']['application/json'];
type UpdateFormDetailsBody =
  ApiPaths['/api/v1/forms/{formId}']['patch']['requestBody']['content']['application/json'];

export function getDeliverable(deliverableId: string): Promise<Deliverable> {
  return apiFetch(`/api/v1/deliverables/${deliverableId}`);
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

export function addUserStory(
  deliverableId: string,
  body: CreateUserStoryBody,
): Promise<UserStory> {
  return apiFetch(`/api/v1/deliverables/${deliverableId}/user-stories`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function removeUserStory(
  deliverableId: string,
  userStoryId: string,
): Promise<void> {
  return apiFetch(
    `/api/v1/deliverables/${deliverableId}/user-stories/${userStoryId}`,
    { method: 'DELETE' },
  );
}

export function reorderUserStories(
  deliverableId: string,
  userStoryIds: string[],
): Promise<UserStory[]> {
  return apiFetch(`/api/v1/deliverables/${deliverableId}/user-stories/order`, {
    method: 'PUT',
    body: JSON.stringify({ userStoryIds }),
  });
}

export function addAcceptanceCriterion(
  userStoryId: string,
  body: CreateAcceptanceCriterionBody,
): Promise<AcceptanceCriterion> {
  return apiFetch(`/api/v1/user-stories/${userStoryId}/acceptance-criteria`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function removeAcceptanceCriterion(
  userStoryId: string,
  acceptanceCriterionId: string,
): Promise<void> {
  return apiFetch(
    `/api/v1/user-stories/${userStoryId}/acceptance-criteria/${acceptanceCriterionId}`,
    { method: 'DELETE' },
  );
}

export function reorderAcceptanceCriteria(
  userStoryId: string,
  acceptanceCriteriaIds: string[],
): Promise<AcceptanceCriterion[]> {
  return apiFetch(
    `/api/v1/user-stories/${userStoryId}/acceptance-criteria/order`,
    { method: 'PUT', body: JSON.stringify({ acceptanceCriteriaIds }) },
  );
}

// A UserStory or AcceptanceCriterion is literally a Form sharing its id, so editing
// its name/description reuses the plain form endpoint unchanged.
export function updateFormDetails(
  formId: string,
  body: UpdateFormDetailsBody,
): Promise<unknown> {
  return apiFetch(`/api/v1/forms/${formId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
