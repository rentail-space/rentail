export async function loader() {
  const trafficAdvice = [
    {
      user_agent: "prefetch-proxy",
      google_prefetch_proxy_eap: {
        fraction: 1.0,
      },
    },
  ];

  return new Response(JSON.stringify(trafficAdvice), {
    headers: { "Content-Type": "application/trafficadvice+json" },
  });
}
