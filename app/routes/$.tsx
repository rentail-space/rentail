export async function loader() {
  return new Response("Not Found", { status: 404 });
}

export default function NotFoundPage() {
  return (
    <main className="prose prose-lg mx-auto py-32">
      <h1 className="flex flex-row gap-2 text-4xl mx-auto justify-center ">
        <span className="text-red-500 font-bold">404</span>
        <span className="text-gray-500">Not found</span>
      </h1>
    </main>
  );
}
