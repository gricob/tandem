import type { ApiPaths } from '../../api/client';

// Generic `Form`/`FormField` domain types, kept here even though the
// standalone Forms browsing feature was retired: `UserStory` and
// `AcceptanceCriterion` (see `deliverables/api.ts`) are themselves `Form`s,
// and `FormField`-shaped values are what `form-responses`' `ResponseFields`
// renders for a deliverable's user stories/acceptance criteria.
export type Form =
  ApiPaths['/api/v1/forms']['get']['responses'][200]['content']['application/json'][number];
export type FormField = Form['fields'][number];
