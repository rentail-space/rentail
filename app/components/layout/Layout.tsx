import Footer from "./Footer";
import Header from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col gap-8">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
