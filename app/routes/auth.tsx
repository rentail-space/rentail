import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import { AlertCircle } from "lucide-react";
import { useId } from "react";
import { redirect, useFetcher } from "react-router";
import { useToggle } from "usehooks-ts";
import { Button } from "~/components/ui/Button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
} from "~/components/ui/FieldSet";
import { Input } from "~/components/ui/Input";
import { signInEmail, signUpEmail } from "~/lib/sessions.server";
import type { Route } from "./+types/auth";

export const handle = { headerLinks: [] };

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const form = await request.formData();
  try {
    const email = form.get("email")?.toString().trim().toLowerCase();
    const password = form.get("password")?.toString().trim();
    invariant(email, "Email is required");
    invariant(password, "Password is required");

    if (form.has("name")) {
      const name = form.get("name")?.toString().trim() ?? "Anonymous";
      const returnedHeaders = await signUpEmail({
        email,
        name,
        password,
        requestHeaders: request.headers,
      });
      return redirect("/chat", { headers: returnedHeaders });
    } else {
      const responseHeaders = await signInEmail({
        email,
        password,
        requestHeaders: request.headers,
      });
      return redirect("/chat", { headers: responseHeaders });
    }
  } catch (error) {
    captureException(error, { extra: { form } });
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";
    console.error("Error in auth: %s", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default function AuthPage() {
  const [isSignUp, toggleIsSignUp] = useToggle(false);
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const fetcher = useFetcher();

  return (
    <main className="flex flex-col items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <section className="mx-4 my-10 w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        <header>
          <h1 className="text-center font-bold text-3xl">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-center text-gray-600">
            {isSignUp
              ? "Sign up to start finding retail spaces"
              : "Sign in to your account"}
          </p>
        </header>

        <fetcher.Form method="post" className="space-y-6">
          <FieldSet>
            {isSignUp && (
              <Field>
                <FieldLabel htmlFor={nameId}>Full Name</FieldLabel>
                <Input
                  id={nameId}
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor={emailId}>Email Address</FieldLabel>
              <Input
                id={emailId}
                name="email"
                placeholder="you@example.com"
                required
                type="email"
                style={{}}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
              <Input
                id={passwordId}
                minLength={8}
                name="password"
                placeholder="••••••••"
                required
                type="password"
                style={{}}
              />
              <FieldDescription>Must be at least 8 characters</FieldDescription>
            </Field>
          </FieldSet>

          {fetcher.data?.error && (
            <FieldError errors={[fetcher.data.error]}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 shrink-0 stroke-current" />
                {fetcher.data.error}
              </div>
            </FieldError>
          )}

          <Button
            className="flex w-full items-center justify-center gap-2 p-6 font-bold text-lg"
            disabled={fetcher.state !== "idle"}
            type="submit"
            variant="default"
          >
            {fetcher.state !== "idle" && (
              <span className="loading loading-spinner" />
            )}
            {isSignUp
              ? fetcher.state === "idle"
                ? "Create Account"
                : "Creating Your Account..."
              : fetcher.state === "idle"
                ? "Sign In"
                : "Signing You In..."}
          </Button>
        </fetcher.Form>

        <Button
          className="text-center font-bold text-lg"
          onClick={toggleIsSignUp}
          type="button"
          variant="ghost"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Create one"}
        </Button>

        <Footer isSignUp={isSignUp} />
      </section>
    </main>
  );
}

function Footer({ isSignUp }: { isSignUp: boolean }) {
  return (
    <footer className="mt-8 text-center text-gray-600 text-sm">
      By {isSignUp ? "signing up" : "signing in"}, you agree to our{" "}
      <a href="/terms" className="link">
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="/privacy" className="link">
        Privacy Policy
      </a>
    </footer>
  );
}
