export async function loader() {
  const trafficAdvice = [
    {
      google_prefetch_proxy_eap: { fraction: 1.0 },
      user_agent: "prefetch-proxy",
    },
  ];

  return new Response(JSON.stringify(trafficAdvice), {
    headers: { "Content-Type": "application/trafficadvice+json" },
  });
}
