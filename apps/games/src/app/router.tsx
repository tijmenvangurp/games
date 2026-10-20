import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type RouteComponent,
  type RouterHistory,
} from "@tanstack/react-router";
import { AlchemyPage } from "@pages/alchemy";
import { ArrowsPage } from "@pages/arrow";
import { ChessGamePage, ChessPage, ChessTutorialPage } from "@pages/chess";
import { FlagsPage } from "@pages/flags";
import { FrenchLessonPage, FrenchPage, FrenchReviewPage, FrenchSortPage } from "@pages/french";
import { HomePage } from "@pages/home";
import { LettersPage } from "@pages/letter";
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
    gameRoute("/schaken/les", ChessTutorialPage),
    gameRoute("/schaken/partij", ChessGamePage),
    gameRoute("/puzzels", PuzzlesPage),
    gameRoute("/woordzoeker", WordSearchPage),
    gameRoute("/vlaggen", FlagsPage),
    gameRoute("/mengelmoes", AlchemyPage),
    gameRoute("/frans", FrenchPage),
    gameRoute("/frans/herhalen", FrenchReviewPage),
    gameRoute("/frans/sorteren", FrenchSortPage),
    gameRoute("/letters", LettersPage),
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
