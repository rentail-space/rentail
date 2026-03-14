/**
 * Track bot visits in database
 */

export async function trackBotVisit(request: Request): Promise<void> {
  const apiKey = "cite.me.in_sSZflmJuJXGgGbU2";
  const endpoint = "https://cite.me.in/api/track";
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      accept: request.headers.get("accept"),
      ip: request.headers.get("x-forwarded-for"),
      referer: request.headers.get("referer"),
      url: request.url.toString(),
      userAgent: request.headers.get("user-agent"),
    }),
  }).catch(() => {});
}
