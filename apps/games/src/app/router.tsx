import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type RouteComponent,
  type RouterHistory,
} from "@tanstack/react-router";
import { ArrowsPage } from "@pages/arrow";
import { ChessPage } from "@pages/chess";
import { FrenchLessonPage, FrenchPage, FrenchReviewPage, FrenchSortPage } from "@pages/french";
import { HomePage } from "@pages/home";
import { MathPage } from "@pages/math";
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
  const gameRoute = <TPath extends string>(path: TPath, component: RouteComponent) =>
    createRoute({ getParentRoute: () => rootRoute, path, component });

  const frenchLessonRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/frans/$lessonId",
    component: FrenchLessonPage,
  });

  const routeTree = rootRoute.addChildren([
    gameRoute("/", HomePage),
    gameRoute("/sudoku", SudokuPage),
    gameRoute("/pijlen", ArrowsPage),
    gameRoute("/rekenen", MathPage),
    gameRoute("/zoeken", SeekPage),
    gameRoute("/memory", MemoryPage),
    gameRoute("/raad", PokemonQuizPage),
    gameRoute("/schaken", ChessPage),
    gameRoute("/puzzels", PuzzlesPage),
    gameRoute("/woordzoeker", WordSearchPage),
    gameRoute("/frans", FrenchPage),
    gameRoute("/frans/herhalen", FrenchReviewPage),
    gameRoute("/frans/sorteren", FrenchSortPage),
    frenchLessonRoute,
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
