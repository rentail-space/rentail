import { ExternalLink } from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import CentersMap from "~/components/ui/CentersMap";
import { Spaces } from "./Spaces";

export default function Center({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <div className="mx-auto my-10 flex max-w-4xl flex-col gap-6 px-4">
      <h1 className="font-bold text-4xl text-black">
        {center.website ? (
          <Link
            to={center.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transform rounded-[10px] border-2 border-black bg-[hsl(37,92%,65%)] px-6 py-3 font-bold text-black no-underline shadow-[6px_6px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_black]"
          >
            {center.name}
          </Link>
        ) : (
          center.name
        )}
      </h1>

      <section className="rounded-[10px] border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]">
        <Link
          to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${center.address}, ${center.city}, ${center.state} ${center.country}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-row items-center gap-2 font-bold text-black underline decoration-2 underline-offset-2 hover:decoration-[hsl(37,92%,65%)]"
        >
          <span>
            {center.address}, {center.city}, {center.state}
          </span>
          <ExternalLink className="h-5 w-5" />
        </Link>
      </section>

      {center.imageURLs.length > 0 && (
        <section className="overflow-hidden rounded-[10px] border-2 border-black shadow-[6px_6px_0px_0px_black]">
          <img className="w-full" src={center.imageURLs[0]} alt={center.name} />
        </section>
      )}

      <section className="prose prose-lg max-w-none rounded-[10px] border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]">
        <Streamdown remarkPlugins={[remarkGfm]} mode="static">
          {center.description}
        </Streamdown>
      </section>

      <section className="flex flex-col gap-4">
        <Spaces spaces={center.spaces} />
      </section>

      <section className="overflow-hidden rounded-[10px] border-2 border-black shadow-[6px_6px_0px_0px_black]">
        <CentersMap
          centers={[center]}
          latitude={center.latitude ?? 0}
          longitude={center.longitude ?? 0}
          zoom={12}
        />
      </section>
    </div>
  );
}
