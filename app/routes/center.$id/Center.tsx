import type { PropertyGetPayload } from "prisma/generated/models";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import CentersMap from "~/components/ui/CentersMap";
import CenterInfo from "./CenterInfo";
import { Spaces } from "./Spaces";

export default function Center({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <div className="mx-auto my-10 flex max-w-4xl flex-col gap-6 px-4">
      <h1 className="rounded-md border-2 border-black bg-[hsl(37,92%,65%)] px-6 py-3 font-bold text-4xl text-black shadow-[6px_6px_0px_0px_black]">
        {center.name}
      </h1>

      <section className="rounded-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]">
        <CenterInfo center={center} />
      </section>

      {center.imageURLs.length > 0 && (
        <section className="overflow-hidden rounded-md border-2 border-black shadow-[6px_6px_0px_0px_black]">
          <img className="w-full" src={center.imageURLs[0]} alt={center.name} />
        </section>
      )}

      <section className="prose prose-lg max-w-none rounded-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]">
        <Streamdown remarkPlugins={[remarkGfm]} mode="static">
          {center.description}
        </Streamdown>
      </section>

      <section className="rounded-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]">
        <Spaces spaces={center.spaces} />
      </section>

      <section className="overflow-hidden rounded-md border-2 border-black shadow-[6px_6px_0px_0px_black]">
        <CentersMap
          centers={[center]}
          latitude={center.latitude}
          longitude={center.longitude}
        />
      </section>
    </div>
  );
}
