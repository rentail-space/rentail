import { AlertCircle, AlertTriangle } from "lucide-react";
import { useEffect, useId } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

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

  useEffect(() => {
    document.getElementById(emailId)?.focus();
  }, [emailId]);

  return (
    <form method="post" onSubmit={onSubmit} className="space-y-6">
      {fetcher.data?.error ? (
        <div role="alert" className="alert alert-error">
          <AlertCircle className="h-6 w-6 shrink-0 stroke-current" />
          <span>{fetcher.data.error}</span>
        </div>
      ) : fetcher.data?.success ? (
        <div role="alert" className="alert alert-warning">
          <AlertTriangle className="h-6 w-6 shrink-0 stroke-current" />
          <span>
            A verification link has been sent to your new email address. You
            must verify your email before you can sign in with it.
          </span>
        </div>
      ) : null}

      <fieldset className="fieldset">
        <label className="label" htmlFor={emailId}>
          New Email Address
        </label>
        <Input
          defaultValue={user.email || ""}
          id={emailId}
          minLength={3}
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </fieldset>

      <Button
        type="submit"
        disabled={fetcher.state !== "idle" || fetcher.data?.verificationSent}
        className="w-40"
        variant="default"
      >
        {fetcher.state !== "idle" ? "Sending verification..." : "Change Email"}
      </Button>
    </form>
  );
}
