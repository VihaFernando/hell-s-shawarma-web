import { createFileRoute } from "@tanstack/react-router";

import {
  BlogNotFound,
  ListingPage,
  listingRouteHead,
  loadListing,
  parsePageParam,
} from "@/components/blog/listing-route";
import { categoryPath } from "@/lib/blog/seo";

export const Route = createFileRoute("/blog/category/$category/page/$page")({
  loader: ({ params }) =>
    loadListing({
      page: parsePageParam(params.page, categoryPath(params.category)),
      categorySlug: params.category,
    }),
  head: ({ loaderData }) => listingRouteHead(loaderData),
  component: ListingRoutePage,
  notFoundComponent: BlogNotFound,
});

function ListingRoutePage() {
  return <ListingPage data={Route.useLoaderData()} />;
}
