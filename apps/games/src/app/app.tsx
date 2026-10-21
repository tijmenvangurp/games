import { RouterProvider } from "@tanstack/react-router";
import { MotionProvider } from "@shared/ui";
import { router as defaultRouter, type AppRouter } from "@app/router";

interface AppProps {
  router?: AppRouter;
}

export function App({ router = defaultRouter }: AppProps) {
  return (
    <MotionProvider>
      <RouterProvider router={router} />
    </MotionProvider>
  );
}
