import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { FormTemplateEditPage } from '../features/form-templates/form-template-edit-page';
import { FormTemplatesListPage } from '../features/form-templates/form-templates-list-page';
import { InviteUsersPage } from '../features/invites/invite-users-page';
import { RootLayout } from '../features/navigation/root-layout';
import { WorkPage } from '../features/work/work-page';
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

const invitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invites',
  component: InviteUsersPage,
});

interface WorkSearch {
  ws?: string;
  del?: string;
}

const workRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work',
  validateSearch: (search: Record<string, unknown>): WorkSearch => ({
    ws: typeof search.ws === 'string' ? search.ws : undefined,
    del: typeof search.del === 'string' ? search.del : undefined,
  }),
  component: WorkPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  formTemplatesRoute,
  formTemplateEditRoute,
  invitesRoute,
  workRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
