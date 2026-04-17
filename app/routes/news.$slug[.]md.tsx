import invariant from "tiny-invariant";
import { trackBotVisit } from "~/lib/middleware/botTracking.server";
import { loadNewsItem } from "~/lib/newsItems.server";
import { formatDateHuge } from "~/lib/temporal";
import type { Route } from "./+types/news.$slug";

export async function loader({ params, request }: Route.LoaderArgs) {
  await trackBotVisit(request);
  try {
    const { slug } = params;
    invariant(slug, "Slug is required");
    const news = await loadNewsItem(slug);
    const md = `
# ${news.title}

**Published:** ${formatDateHuge(news.published)}

---

${news.body}

---

**More news:** [All news](/news/sitemap.md)
    `.trim();
    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<https://rentail.space/news/${slug}>; rel="alternate"; type="text/html"`,
      },
    });
  } catch {
    throw new Response("Not Found", { status: 404 });
  }
}
