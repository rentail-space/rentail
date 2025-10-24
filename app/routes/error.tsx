export async function loader() {
  return new Response("Error", { status: 500 });
}

export default function NotFoundPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl text-red-500">
        500 <span className="font-bold">Oops! Something went wrong</span>
      </h1>
    </div>
  );
}
