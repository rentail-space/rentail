import getSitemapRoutes from "~/lib/sitemapRoutes";

export async function loader() {
  const urls = await getSitemapRoutes();
  return new Response(urls.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
