import { HttpResponse, http } from "msw";

export const handlers = [
  // Block any other external HTTP services not explicitly mocked
  http.get("https://*/*", ({ request }) => {
    console.warn(`[MSW] Blocked external HTTP GET request to: ${request.url}`);
    return HttpResponse.json(
      { error: "External HTTP requests are not allowed in tests" },
      { status: 503 },
    );
  }),

  http.post("https://*/*", ({ request }) => {
    console.warn(`[MSW] Blocked external HTTP POST request to: ${request.url}`);
    return HttpResponse.json(
      { error: "External HTTP requests are not allowed in tests" },
      { status: 503 },
    );
  }),

  // Allow all localhost requests to pass through (for dev server communication)
  http.get(/^https?:\/\/localhost:\d+/, () => {
    return; // Pass through to real server
  }),
];
