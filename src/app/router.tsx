import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type RouterHistory,
} from "@tanstack/react-router";
import { HomePage } from "@pages/home";
import { SudokuPage } from "@pages/sudoku";

export function createAppRouter(history?: RouterHistory) {
  const rootRoute = createRootRoute({
    component: Outlet,
  });

  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomePage,
  });

  const sudokuRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/sudoku",
    component: SudokuPage,
  });

  const routeTree = rootRoute.addChildren([homeRoute, sudokuRoute]);

  return createRouter({ routeTree, ...(history ? { history } : {}) });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
