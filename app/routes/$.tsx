export async function loader() {
  return new Response("Not Found", { status: 404 });
}

export default function NotFoundPage() {
  return (
    <main className="typeset typeset-docs mx-auto py-32">
      <h1 className="mx-auto flex flex-row items-center justify-center gap-2 text-4xl">
        <span className="font-bold text-red-500">404</span>
        <span className="text-center text-gray-500">Not found</span>
      </h1>
    </main>
  );
}
