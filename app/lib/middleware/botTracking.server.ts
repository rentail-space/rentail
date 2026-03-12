/**
 * Track bot visits in database
 */
export async function trackBotVisit(request: Request): Promise<void> {
  fetch("https://cite.me.app.vercel.app/api/track", {
    method: "POST",
    headers: {
      Authorization: "Bearer cite.me.in_21945ffb0342eb204b60aaf28c7bdca9",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accept: request.headers.get("accept"),
      ip: request.headers.get("x-real-ip"),
      referer: request.headers.get("referer"),
      url: request.url,
      userAgent: request.headers.get("user-agent"),
    }),
  });
}
