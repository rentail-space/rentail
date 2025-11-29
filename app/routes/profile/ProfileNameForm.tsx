import { AlertCircle, CheckCircle } from "lucide-react";
import { useId } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export default function ProfileNameForm({
  user,
}: {
  user: { name: string | null };
}) {
  const nameId = useId();
  const fetcher = useFetcher();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget);
  }

  return (
    <form className="space-y-6" method="post" onSubmit={onSubmit}>
      <Field>
        <FieldLabel htmlFor={nameId}>Full Name</FieldLabel>
        <Input
          type="text"
          id={nameId}
          defaultValue={user.name || ""}
          name="name"
          required
          placeholder="John Doe"
        />
      </Field>

      {fetcher.data?.error ? (
        <div role="alert" className="alert alert-error">
          <AlertCircle className="h-6 w-6 shrink-0 stroke-current" />
          <span>Something went wrong. Please try again.</span>
        </div>
      ) : fetcher.data?.success ? (
        <div role="alert" className="alert alert-success">
          <CheckCircle className="h-6 w-6 shrink-0 stroke-current" />
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
