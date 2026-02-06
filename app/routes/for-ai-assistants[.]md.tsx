import forAIAssistants from "~/data/for-ai-assistants.md?raw";

export async function loader() {
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
