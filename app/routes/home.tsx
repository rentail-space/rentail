import { useId } from "react";
import { HeroSection } from "~/components/home/HeroSection";
import { FeaturesSection } from "~/components/home/FeaturesSection";
import { HowItWorksSection } from "~/components/home/HowItWorksSection";
import { Footer } from "~/components/layout/Footer";

export function meta() {
  return [{ title: "Find your speciality lease with ease" }];
}

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
