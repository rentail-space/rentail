import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import { useEffect, useId, useState } from "react";
import { redirect, useFetcher } from "react-router";
import { ulid } from "ulid";
import authServer from "~/lib/auth.server";
import { updateNewUser } from "~/sessions.server";
import type { Route } from "./+types/auth";

export const handle = { hideLayout: true };

export const clientLoader = async () => {
  return {};
};

clientLoader.hydrate = true as const;

export async function action({
  request,
}: Route.ActionArgs): Promise<{ error: string | null } | Response> {
  const form = await request.formData();
  const email = form.get("email")?.toString();
  const isSignUp = form.get("isSignUp")?.toString() === "true";
  const name = form.get("name")?.toString();
  const password = form.get("password")?.toString();

  try {
    if (isSignUp) {
      const response = await authServer.api.getSession({
        headers: request.headers,
        returnHeaders: true,
      });
      invariant(response, "Session data is required");
      invariant(email, "Email is required");
      invariant(password, "Password is required");
      invariant(name, "Name is required");
      try {
        const { response, headers } = await authServer.api.signUpEmail({
          body: { email, password, name },
          headers: request.headers,
          returnHeaders: true,
        });
        await updateNewUser({
          chatId: ulid(),
          headers: request.headers,
          userId: response.user.id,
        });
        return redirect("/chat", { headers });
      } catch {
        const result = await authServer.api.signInEmail({
          body: { email, password },
          headers: request.headers,
          returnHeaders: true,
        });
        return redirect("/chat", { headers: result.headers });
      }
    } else {
      invariant(email, "Email is required");
      invariant(password, "Password is required");
      const result = await authServer.api.signInEmail({
        body: { email, password },
        headers: request.headers,
        returnHeaders: true,
      });
      return redirect("/chat", { headers: result.headers });
    }
  } catch (error) {
    captureException(error, { extra: { email, isSignUp } });
    console.error("Error in auth: %s", error);
    return {
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const fetcher = useFetcher();
  const [error, setError] = useState<string | null>(null);

  // Show error after form submission, but allow form change to clear error
  useEffect(() => {
    if (fetcher.data?.error) setError(fetcher.data.error);
  }, [fetcher.data]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <header className="mb-8 text-center">
            <h1 className="font-bold text-3xl text-gray-900">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-2 text-gray-600">
              {isSignUp
                ? "Sign up to start finding retail spaces"
                : "Sign in to your account"}
            </p>
          </header>

          <fetcher.Form className="space-y-6" method="post">
            {isSignUp && (
              <div>
                <label
                  htmlFor={nameId}
                  className="block font-medium text-gray-700 text-sm"
                >
                  Full Name
                </label>
                <input
                  id={nameId}
                  name="name"
                  type="text"
                  required={isSignUp}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label
                htmlFor={emailId}
                className="block font-medium text-gray-700 text-sm"
              >
                Email Address
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor={passwordId}
                className="block font-medium text-gray-700 text-sm"
              >
                Password
              </label>
              <input
                id={passwordId}
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
              {isSignUp && (
                <p className="mt-1 text-gray-500 text-sm">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
              name="isSignUp"
              type="submit"
              value={isSignUp.toString()}
              disabled={fetcher.state !== "idle"}
            >
              {isSignUp
                ? fetcher.state === "idle"
                  ? "Create Account"
                  : "Creating Your Account..."
                : fetcher.state === "idle"
                  ? "Sign In"
                  : "Signing You In..."}
            </button>
          </fetcher.Form>

          <div className="mt-6 text-center">
            <button
              className="text-indigo-600 text-sm hover:text-indigo-700 hover:underline"
              onClick={() => {
                setError(null);
                setIsSignUp((isSignUp) => !isSignUp);
              }}
              type="button"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-gray-600 text-sm">
          By {isSignUp ? "signing up" : "signing in"}, you agree to our{" "}
          <a href="/terms" className="text-indigo-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
