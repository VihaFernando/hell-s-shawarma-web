import { createFileRoute } from "@tanstack/react-router";

import {
  BlogNotFound,
  ListingPage,
  listingRouteHead,
  loadListing,
  parsePageParam,
} from "@/components/blog/listing-route";

export const Route = createFileRoute("/blog/page/$page")({
  loader: ({ params }) => loadListing({ page: parsePageParam(params.page, "/blog") }),
  head: ({ loaderData }) => listingRouteHead(loaderData),
  component: ListingRoutePage,
  notFoundComponent: BlogNotFound,
});

function ListingRoutePage() {
  return <ListingPage data={Route.useLoaderData()} />;
}
