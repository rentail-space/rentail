import AboutCTA from "./AboutCTA";
import AboutHeader from "./AboutHeader";
import AboutMission from "./AboutMission";
import AboutStory from "./AboutStory";
import AboutTeam from "./AboutTeam";
import AboutValues from "./AboutValues";

export const handle = { showHeader: true, showFooter: true };

export default function About() {
  return (
    <main className="flex min-h-screen flex-col">
      <AboutHeader />
      <AboutStory />
      <AboutValues />
      <AboutTeam />
      <AboutMission />
      <AboutCTA />
    </main>
  );
}
