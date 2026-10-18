import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type RouterHistory,
} from "@tanstack/react-router";
import { ArrowsPage } from "@pages/arrow";
import { ChessPage } from "@pages/chess";
import { HomePage } from "@pages/home";
import { MemoryPage } from "@pages/memory";
import { PokemonQuizPage } from "@pages/pokemon-quiz";
import { PuzzlesPage } from "@pages/puzzles";
import { SeekPage } from "@pages/seek";
import { SudokuPage } from "@pages/sudoku";
import { WordSearchPage } from "@pages/word-search";

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

  const arrowsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/pijlen",
    component: ArrowsPage,
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

  const chessRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/schaken",
    component: ChessPage,
  });

  const puzzlesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/puzzels",
    component: PuzzlesPage,
  });

  const wordSearchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/woordzoeker",
    component: WordSearchPage,
  });

  const routeTree = rootRoute.addChildren([
    homeRoute,
    sudokuRoute,
    arrowsRoute,
    seekRoute,
    memoryRoute,
    pokemonQuizRoute,
    chessRoute,
    puzzlesRoute,
    wordSearchRoute,
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
