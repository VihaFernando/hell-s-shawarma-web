import { createFileRoute } from "@tanstack/react-router";

import {
  BlogNotFound,
  ListingPage,
  listingRouteHead,
  loadListing,
} from "@/components/blog/listing-route";

export const Route = createFileRoute("/blog/category/$category/")({
  loader: ({ params }) => loadListing({ page: 1, categorySlug: params.category }),
  head: ({ loaderData }) => listingRouteHead(loaderData),
  component: ListingRoutePage,
  notFoundComponent: BlogNotFound,
});

function ListingRoutePage() {
  return <ListingPage data={Route.useLoaderData()} />;
}
