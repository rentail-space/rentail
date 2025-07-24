import { Footer } from "./Footer";
import Header from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen gap-8">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
