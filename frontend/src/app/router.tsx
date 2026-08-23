import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { DeliverableEditPage } from '../features/deliverables/deliverable-edit-page';
import { FormResponseFillPage } from '../features/form-responses/form-response-fill-page';
import { FormResponseViewPage } from '../features/form-responses/form-response-view-page';
import { FormTemplateEditPage } from '../features/form-templates/form-template-edit-page';
import { FormTemplatesListPage } from '../features/form-templates/form-templates-list-page';
import { FormEditPage } from '../features/forms/form-edit-page';
import { FormsListPage } from '../features/forms/forms-list-page';
import { RootLayout } from '../features/navigation/root-layout';
import { WorkstreamDetailPage } from '../features/workstreams/workstream-detail-page';
import { WorkstreamsListPage } from '../features/workstreams/workstreams-list-page';
import { IndexPage } from './index-page';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

const formTemplatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/form-templates',
  component: FormTemplatesListPage,
});

const formTemplateEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/form-templates/$formTemplateId',
  component: FormTemplateEditPage,
});

const formsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms',
  component: FormsListPage,
});

const formEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms/$formId',
  component: FormEditPage,
});

const formResponseFillRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms/$formId/fill',
  component: FormResponseFillPage,
});

const formResponseViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms/$formId/response',
  component: FormResponseViewPage,
});

const deliverableEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deliverables/$deliverableId',
  component: DeliverableEditPage,
});

const workstreamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workstreams',
  component: WorkstreamsListPage,
});

const workstreamDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workstreams/$workstreamId',
  component: WorkstreamDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  formTemplatesRoute,
  formTemplateEditRoute,
  formsRoute,
  formEditRoute,
  formResponseFillRoute,
  formResponseViewRoute,
  deliverableEditRoute,
  workstreamsRoute,
  workstreamDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
