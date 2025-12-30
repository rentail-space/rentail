import AboutCTA from "./AboutCTA";
import AboutHeader from "./AboutHeader";
import AboutMission from "./AboutMission";
import AboutStory from "./AboutStory";
import AboutTeam from "./AboutTeam";
import AboutValues from "./AboutValues";

export default function About() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="About page"
    >
      <title>
        About Rentail.space - Making retail space accessible for everyone
      </title>
      <meta
        name="description"
        content="Rentail.space empowers micro-merchants by making retail spaces more accessible, flexible, and affordable for everyone."
      />
      <meta
        name="keywords"
        content="about rentail.space, retail space, micro-merchants, brick-and-mortar, democratize retail space"
      />
      <link rel="canonical" href="https://rentail.space/about" />

      <div className="container mx-auto my-10 space-y-8 p-5">
        <AboutHeader />
        <AboutStory />
        <AboutValues />
        <AboutTeam />
        <AboutMission />
      </div>
      <AboutCTA />
    </main>
  );
}
