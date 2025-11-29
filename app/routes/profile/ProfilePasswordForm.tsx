import { AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";

export default function ProfilePasswordForm() {
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget);
  }

  useEffect(() => {
    if (fetcher.data?.success) formRef.current?.reset();
  }, [fetcher.data?.success]);

  return (
    <form ref={formRef} method="post" onSubmit={onSubmit} className="space-y-6">
      {fetcher.data?.error ? (
        <div role="alert" className="alert alert-error">
          <AlertCircle className="h-6 w-6 shrink-0 stroke-current" />
          <span>{fetcher.data.error}</span>
        </div>
      ) : fetcher.data?.success ? (
        <div role="alert" className="alert alert-success">
          <CheckCircle className="h-6 w-6 shrink-0 stroke-current" />
          <span>Password changed successfully!</span>
        </div>
      ) : null}

      <fieldset className="fieldset">
        <label className="label" htmlFor={currentPasswordId}>
          Current Password
        </label>
        <input
          className="input input-lg w-full"
          type="password"
          name="currentPassword"
          id={currentPasswordId}
          required
          placeholder="••••••••"
        />

        <label className="label" htmlFor={newPasswordId}>
          New Password
        </label>
        <input
          type="password"
          id={newPasswordId}
          name="newPassword"
          required
          minLength={8}
          className="input input-lg w-full"
          placeholder="••••••••"
        />
        <p className="mt-1 text-gray-500 text-sm">
          Must be at least 8 characters
        </p>

        <label className="label" htmlFor={confirmPasswordId}>
          Confirm New Password
        </label>
        <input
          className="input input-lg w-full"
          type="password"
          name="confirmPassword"
          id={confirmPasswordId}
          required
          minLength={8}
          placeholder="••••••••"
        />
      </fieldset>

      <Button
        className="w-40"
        variant="default"
        disabled={fetcher.state !== "idle"}
        type="submit"
      >
        {fetcher.state !== "idle" ? "Changing password..." : "Change Password"}
      </Button>
    </form>
  );
}
