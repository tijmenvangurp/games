import { RouterProvider } from "@tanstack/react-router";
import { router as defaultRouter, type AppRouter } from "@app/router";

interface AppProps {
  router?: AppRouter;
}

export function App({ router = defaultRouter }: AppProps) {
  return <RouterProvider router={router} />;
}
