import Footer from "~/components/layout/Footer";
import Header from "~/components/layout/Header";

export async function loader() {
  return new Response("Not Found", { status: 404 });
}

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col inset-0">
      <Header />
      <div className="flex flex-col gap-4 h-screen w-screen items-center justify-center">
        <h1 className="text-4xl">
          404 <span className="font-bold">Not found</span>
        </h1>
      </div>
      <Footer />
    </div>
  );
}
