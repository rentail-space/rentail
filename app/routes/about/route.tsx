import AboutCTA from "./AboutCTA";
import AboutHeader from "./AboutHeader";
import AboutMission from "./AboutMission";
import AboutStory from "./AboutStory";
import AboutTeam from "./AboutTeam";
import AboutValues from "./AboutValues";

export default function About() {
  return (
    <main className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]">
      <AboutHeader />
      <AboutStory />
      <AboutValues />
      <AboutTeam />
      <AboutMission />
      <AboutCTA />
    </main>
  );
}
