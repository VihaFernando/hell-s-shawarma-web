import { createFileRoute } from "@tanstack/react-router";

import {
  BlogNotFound,
  ListingPage,
  listingRouteHead,
  loadListing,
} from "@/components/blog/listing-route";

export const Route = createFileRoute("/blog/")({
  loader: () => loadListing({ page: 1 }),
  head: ({ loaderData }) => listingRouteHead(loaderData),
  component: ListingRoutePage,
  notFoundComponent: BlogNotFound,
});

function ListingRoutePage() {
  return <ListingPage data={Route.useLoaderData()} />;
}
