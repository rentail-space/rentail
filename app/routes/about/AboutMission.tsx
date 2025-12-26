import { Target } from "lucide-react";
import { Card, CardContent } from "~/components/ui/Card";

export default function AboutMission() {
  return (
    <Card className="mx-auto max-w-3xl bg-[hsl(60,100%,99%)] p-10">
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-base border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h2 className="mb-4 font-bold text-3xl text-black leading-tight">
              Our Mission
            </h2>
            <p className="font-medium text-black text-lg leading-relaxed">
              To empower 1 million entrepreneurs to start and grow their retail
              businesses by making short-term retail space as easy to find and
              book as a hotel room. We believe physical retail should be
              accessible to everyone, not just those with deep pockets and
              industry connections.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
