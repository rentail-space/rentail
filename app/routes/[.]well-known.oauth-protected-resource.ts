export async function loader() {
  return new Response(
    JSON.stringify({
      protected_resources: [],
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}
