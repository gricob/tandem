import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { FormTypeEditPage } from '../features/form-types/form-type-edit-page';
import { FormTypesListPage } from '../features/form-types/form-types-list-page';
import { FormEditPage } from '../features/forms/form-edit-page';
import { FormsListPage } from '../features/forms/forms-list-page';
import { IndexPage } from './index-page';

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

const formTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/form-types',
  component: FormTypesListPage,
});

const formTypeEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/form-types/$formTypeId',
  component: FormTypeEditPage,
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  formTypesRoute,
  formTypeEditRoute,
  formsRoute,
  formEditRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
