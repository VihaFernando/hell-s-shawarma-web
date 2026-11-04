import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Start loading a page (and its Supabase data) on hover/touch, and reuse it for a
    // minute so repeat navigation between blog pages is instant.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 60_000,
    defaultStaleTime: 60_000,
  });

  return router;
};
