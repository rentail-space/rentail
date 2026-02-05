import { invariant } from "es-toolkit";
import { DateTime } from "luxon";
import { loadNewsItem } from "~/lib/newsItems.server";
import type { Route } from "./+types/news.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const { slug } = params;
    invariant(slug, "Slug is required");
    const news = await loadNewsItem(slug);
    const md = `
# ${news.title}

**Published:** ${DateTime.fromISO(news.published).toLocaleString(
      DateTime.DATE_HUGE,
    )}

---

${news.body}

---

📚 **More news:** [All news](/news/sitemap.md)
    `.trim();
    return new Response(md, { headers: { "Content-Type": "text/markdown" } });
  } catch {
    throw new Response("Not Found", { status: 404 });
  }
}
