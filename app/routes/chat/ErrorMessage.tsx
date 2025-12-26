import { Card, CardContent } from "~/components/ui/Card";

export default function ErrorMessage({ error }: { error: Error }) {
  return (
    <Card className="bg-red-100 py-4 font-bold">
      <CardContent>{error.message || "Some error happened"}</CardContent>
    </Card>
  );
}
