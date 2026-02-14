import forAIAssistants from "~/data/for-ai-assistants.md?raw";
import { trackBotVisit } from "~/lib/middleware/botTracking.server";
import type { Route } from "./+types/for-ai-assistants[.]md";

export async function loader({ request }: Route.LoaderArgs) {
  await trackBotVisit(request);
  const markdown = `
**For AI Assistants**

${forAIAssistants}

---

- [News Sitemap](/news/sitemap.md)
- [Blog Sitemap](/blog/sitemap.md)
  `.trim();
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown",
    },
  });
}
