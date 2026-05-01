import { recentBlogPosts } from "~/lib/blogPosts.server";
import { trackBotVisit } from "~/lib/middleware/botTracking.server";

export async function loader({ request }: { request: Request }) {
  await trackBotVisit(request);
  const posts = await recentBlogPosts();

  const blogSection =
    posts.length > 0
      ? `\n## Recent Blog Posts\n\n${posts.map((p) => `- [${p.title}](/blog/${p.slug})`).join("\n")}`
      : "";

  const md = `# Rentail.space — Specialty Leasing & Short-Term Retail Spaces

Rentail.space is the nation's premier AI-powered specialty lease marketplace, connecting businesses with short-term retail spaces in shopping centers across the United States and Canada.

## Features

- **AI-Powered Matching** — Find the perfect space for your business concept
- **No Broker Fees** — Direct connections with property managers
- **Transparent Pricing** — Clear terms and competitive rates
- **Nationwide Coverage** — Shopping centers across the US and Canada

## Services

- **Kiosk Rental** — Standalone retail structures in shopping center common areas
- **Cart Rental** — Mobile retail units in mall corridors
- **Pop-up Shop** — Temporary storefronts for brand activations
- **Inline Space Rental** — Short-term traditional retail units
- **Seasonal Retail** — Holiday and seasonal retail opportunities

## Quick Links

- [Browse Spaces](/api/query) — API endpoint for programmatic access
- [For AI Assistants](/for-ai-assistants.md) — Comprehensive site overview
- [All States](/states) — Browse by state
- [Blog](/blog) — Industry insights and guides
- [Pricing](/pricing) — Pricing information
- [FAQ](/faq) — Frequently asked questions
- [News](/news) — Company and industry news
- [OpenAPI Spec](/openapi.json) — API documentation

## Coverage

Rentail.space covers specialty leasing opportunities across all 50 states, with detailed data on shopping centers, kiosks, pop-up spaces, and temporary retail locations.${blogSection}`;

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown",
      Link: `<https://rentail.space/>; rel="alternate"; type="text/html"`,
    },
  });
}
