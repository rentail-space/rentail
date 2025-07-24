import { generateRobotsTxt } from "@forge42/seo-tools/robots";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const robotsTxt = generateRobotsTxt([
    {
      allow: ["/"],
      disallow: ["/api/*", "/chat"],
      sitemap: ["https://rentail.space/sitemap.xml"],
      userAgent: "*",
    },
  ]);
  return new Response(robotsTxt, { headers: { "Content-Type": "text/plain" } });
}
