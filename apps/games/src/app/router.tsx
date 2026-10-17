import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type RouterHistory,
} from "@tanstack/react-router";
import { HomePage } from "@pages/home";
import { MemoryPage } from "@pages/memory";
import { PokemonQuizPage } from "@pages/pokemon-quiz";
import { SeekPage } from "@pages/seek";
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

  const seekRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/zoeken",
    component: SeekPage,
  });

  const memoryRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/memory",
    component: MemoryPage,
  });

  const pokemonQuizRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/raad",
    component: PokemonQuizPage,
  });

  const routeTree = rootRoute.addChildren([
    homeRoute,
    sudokuRoute,
    seekRoute,
    memoryRoute,
    pokemonQuizRoute,
  ]);

  return createRouter({ routeTree, ...(history ? { history } : {}) });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
