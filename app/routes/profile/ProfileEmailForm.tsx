import { AlertCircle, AlertTriangle } from "lucide-react";
import { useId } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/Button";
import { Field, FieldLabel } from "~/components/ui/FieldSet";
import { Input } from "~/components/ui/Input";

export default function ProfileEmailForm({
  user,
}: {
  user: { email: string | null };
}) {
  const emailId = useId();
  const fetcher = useFetcher();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget);
  }

  return (
    <form method="post" onSubmit={onSubmit} className="space-y-6">
      {fetcher.data?.error ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-base border-2 border-black bg-red-100 p-4 font-bold text-black shadow-[2px_2px_0px_0px_black]"
        >
          <AlertCircle className="h-6 w-6 shrink-0" />
          <span>{fetcher.data.error}</span>
        </div>
      ) : fetcher.data?.success ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-base border-2 border-black bg-yellow-100 p-4 font-bold text-black shadow-[2px_2px_0px_0px_black]"
        >
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <span>
            A verification link has been sent to your new email address. You
            must verify your email before you can sign in with it.
          </span>
        </div>
      ) : null}

      <Field>
        <FieldLabel htmlFor={emailId}>New Email Address</FieldLabel>
        <Input
          defaultValue={user.email || ""}
          id={emailId}
          name="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Button
        type="submit"
        disabled={fetcher.state !== "idle" || fetcher.data?.verificationSent}
        className="float-right w-40"
        variant="default"
      >
        {fetcher.state !== "idle" ? "Sending verification..." : "Change Email"}
      </Button>
    </form>
  );
}
