import { useId } from "react";
import { FeaturesSection } from "~/components/home/FeaturesSection";
import { HeroSection } from "~/components/home/HeroSection";
import { HowItWorksSection } from "~/components/home/HowItWorksSection";
import { Footer } from "~/components/layout/Footer";

export default function Home() {
  const howItWorksId = useId();
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <HeroSection howItWorksId={howItWorksId} />
        <FeaturesSection />
        <HowItWorksSection howItWorksId={howItWorksId} />
      </main>
      <Footer />
    </>
  );
}
