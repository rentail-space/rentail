import type { PropertyGetPayload } from "prisma/generated/models";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import CentersMap from "~/components/ui/CentersMap";
import LoadingImage from "~/components/ui/LoadingImage";
import CenterAttributes from "./CenterAttributes";
import { CenterSpaces } from "./CenterSpaces";

export default function CenterDetails({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <>
      <Card className="bg-[hsl(37,92%,65%)]">
        <CardContent>
          <h1 className="font-bold text-4xl text-black">{center.name}</h1>
        </CardContent>
      </Card>

      <CenterAttributes center={center} />

      {center.imageURLs.length > 0 && (
        <Card className="bg-white p-0!">
          <LoadingImage
            alt={center.name}
            maxHeight={500}
            src={center.imageURLs[0]}
          />
        </Card>
      )}

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="font-bold text-2xl">Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-lg">
          <Streamdown remarkPlugins={[remarkGfm]} mode="static">
            {center.description}
          </Streamdown>
        </CardContent>
      </Card>

      {center.demographics && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="font-bold text-2xl">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="text-lg">
            <Streamdown remarkPlugins={[remarkGfm]} mode="static">
              {center.demographics}
            </Streamdown>
          </CardContent>
        </Card>
      )}

      <CenterSpaces spaces={center.spaces} />

      <Card className="bg-white p-0!">
        <CentersMap
          centers={[center]}
          latitude={center.latitude}
          longitude={center.longitude}
        />
      </Card>
    </>
  );
}
