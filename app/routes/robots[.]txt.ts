import { generateRobotsTxt } from "@forge42/seo-tools/robots";

export async function loader() {
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
