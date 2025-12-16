import { AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/Button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/FieldSet";
import { Input } from "~/components/ui/Input";

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
          className="flex items-center gap-3 rounded-base border-2 border-black bg-green-100 p-4 font-bold text-black shadow-[2px_2px_0px_0px_black]"
        >
          <CheckCircle className="h-6 w-6 shrink-0" />
          <span>Password changed successfully!</span>
        </div>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={currentPasswordId}>Current Password</FieldLabel>
          <Input
            type="password"
            name="currentPassword"
            id={currentPasswordId}
            required
            placeholder="••••••••"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={newPasswordId}>New Password</FieldLabel>
          <Input
            type="password"
            id={newPasswordId}
            name="newPassword"
            required
            minLength={8}
            placeholder="••••••••"
          />
          <FieldDescription>Must be at least 8 characters</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={confirmPasswordId}>
            Confirm New Password
          </FieldLabel>
          <Input
            type="password"
            name="confirmPassword"
            id={confirmPasswordId}
            required
            minLength={8}
            placeholder="••••••••"
          />
        </Field>
      </FieldGroup>

      <Button
        className="float-right w-40"
        variant="default"
        disabled={fetcher.state !== "idle"}
        type="submit"
      >
        {fetcher.state !== "idle" ? "Changing password..." : "Change Password"}
      </Button>
    </form>
  );
}
