import { createFileRoute } from "@tanstack/react-router";

import {
  BlogIndexPending,
  BlogNotFound,
  ListingPage,
  listingRouteHead,
  loadListing,
} from "@/components/blog/listing-route";

export const Route = createFileRoute("/blog/")({
  loader: () => loadListing({ page: 1 }),
  head: ({ loaderData }) => listingRouteHead(loaderData),
  component: ListingRoutePage,
  // Client-side navigation only: show the skeleton almost immediately instead of the
  // router's default 1s wait, and hold it briefly so fast loads don't flicker.
  pendingComponent: BlogIndexPending,
  pendingMs: 100,
  pendingMinMs: 300,
  notFoundComponent: BlogNotFound,
});

function ListingRoutePage() {
  return <ListingPage data={Route.useLoaderData()} />;
}
