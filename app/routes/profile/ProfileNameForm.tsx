import { AlertCircle, CheckCircle } from "lucide-react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/Button";
import { Field, FieldLabel } from "~/components/ui/FieldSet";
import { Input } from "~/components/ui/Input";

export default function ProfileNameForm({
  user,
}: {
  user: { name: string | null };
}) {
  const fetcher = useFetcher();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void fetcher.submit(event.currentTarget);
  }

  return (
    <form className="space-y-6" method="post" onSubmit={onSubmit}>
      <Field>
        <FieldLabel htmlFor="name">Full Name</FieldLabel>
        <Input
          type="text"
          id="name"
          defaultValue={user.name || ""}
          name="name"
          required
          placeholder="John Doe"
        />
      </Field>

      {fetcher.data?.error ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-base border-2 border-black bg-red-100 p-4 font-bold text-black shadow-[2px_2px_0px_0px_black]"
        >
          <AlertCircle className="h-6 w-6 shrink-0" />
          <span>Something went wrong. Please try again.</span>
        </div>
      ) : fetcher.data?.success ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-base border-2 border-black bg-green-100 p-4 font-bold text-black shadow-[2px_2px_0px_0px_black]"
        >
          <CheckCircle className="h-6 w-6 shrink-0" />
          <span>Name updated successfully!</span>
        </div>
      ) : null}

      <Button
        variant="default"
        className="float-right w-40"
        disabled={fetcher.state !== "idle"}
        type="submit"
      >
        {fetcher.state !== "idle" ? "Updating..." : "Update Name"}
      </Button>
    </form>
  );
}
