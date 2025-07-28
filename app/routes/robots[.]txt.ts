import { generateRobotsTxt } from "@forge42/seo-tools/robots";

export async function loader() {
  const robotsTxt = generateRobotsTxt([
    {
      // NOTE: userAgent must show first
      userAgent: "*",
      allow: ["/"],
      disallow: ["/api/*", "/chat"],
      sitemap: ["https://rentail.space/sitemap.xml"],
    },
  ]);
  return new Response(robotsTxt, { headers: { "Content-Type": "text/plain" } });
}
