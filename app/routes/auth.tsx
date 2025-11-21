import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import { AlertCircle } from "lucide-react";
import { useId, useState } from "react";
import { redirect, useFetcher } from "react-router";
import { ulid } from "ulid";
import authServer from "~/lib/auth.server";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { updateNewUser } from "~/sessions.server";
import type { Route } from "./+types/auth";

export const handle = { hideLayout: true };

export const clientLoader = async () => {
  return {};
};

clientLoader.hydrate = true as const;

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const form = await request.formData();
  try {
    return form.has("name")
      ? await signUpEmail({ form, headers: request.headers })
      : await signInEmail({ form, headers: request.headers });
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

/**
 * Add Domain attribute to session cookies for production Safari compatibility.
 * Better Auth's __Secure- prefix cookies need explicit Domain to be accepted.
 */
function fixSetCookieHeaders(headers: Headers): Headers {
  if (!env.isProduction) return headers;

  const fixed = new Headers(headers);
  const cookies = fixed.getSetCookie();

  fixed.delete("set-cookie");
  for (const cookie of cookies)
    if (cookie.includes("__Secure-") && !cookie.includes("Domain="))
      fixed.append("set-cookie", `${cookie}; Domain=rentail.space`);
    else fixed.append("set-cookie", cookie);

  return fixed;
}

/**
 * Sign up with email and password. Redirects to the chat page on success.  If
 * the user already exists, it will try to sign them in instead.
 *
 * @param form - The form data containing the email, password, and name.
 * @param headers - The headers object containing the request headers. Used to
 * associate anonymous user with the new user.
 * @returns A redirect response to the chat page.
 * @throws An error if the email or password is invalid, or if the user already exists.
 */
async function signUpEmail({
  form,
  headers,
}: {
  form: FormData;
  headers: Headers;
}): Promise<Response> {
  const email = form.get("email")?.toString();
  const name = form.get("name")?.toString();
  const password = form.get("password")?.toString();
  invariant(name, "Name is required");
  invariant(email, "Email is required");
  invariant(password, "Password is required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) return await signInEmail({ form, headers });

  const { response, headers: returnedHeaders } =
    await authServer.api.signUpEmail({
      body: { email, password, name, rememberMe: true },
      headers,
      returnHeaders: true,
    });
  await updateNewUser({
    chatId: ulid(),
    requestHeaders: headers,
    userId: response.user.id,
  });
  return redirect("/chat", { headers: fixSetCookieHeaders(returnedHeaders) });
}

/**
 * Sign in with email and password. Returns a redirect response to the chat page
 * on success, throws an error if the email or password are invalid.
 *
 * @param form - The form data containing the email and password.
 * @returns A redirect response to the chat page
 * @throws An error if the email or password are invalid
 */
async function signInEmail({
  form,
  headers,
}: {
  form: FormData;
  headers: Headers;
}): Promise<Response> {
  const email = form.get("email")?.toString();
  const password = form.get("password")?.toString();
  invariant(email, "Email is required");
  invariant(password, "Password is required");
  const { headers: responseHeaders } = await authServer.api.signInEmail({
    body: { email, password, rememberMe: true },
    headers,
    returnHeaders: true,
  });
  return redirect("/chat", { headers: fixSetCookieHeaders(responseHeaders) });
}

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const fetcher = useFetcher();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="card card-border w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="card-body space-y-6">
          <div>
            <h1 className="text-center font-bold text-3xl">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-center text-gray-600">
              {isSignUp
                ? "Sign up to start finding retail spaces"
                : "Sign in to your account"}
            </p>
          </div>

          <fetcher.Form method="post" className="space-y-6">
            <fieldset className="fieldset">
              {isSignUp && (
                <div>
                  <label htmlFor={nameId} className="label">
                    Full Name
                  </label>
                  <input
                    id={nameId}
                    name="name"
                    type="text"
                    required
                    className="input input-lg w-full"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <label htmlFor={emailId} className="label">
                Email Address
              </label>
              <input
                className="input input-lg w-full"
                id={emailId}
                name="email"
                placeholder="you@example.com"
                required
                type="email"
                style={{}}
              />

              <label htmlFor={passwordId} className="fieldset-label">
                Password
              </label>
              <input
                className="input input-lg w-full"
                id={passwordId}
                minLength={8}
                name="password"
                placeholder="••••••••"
                required
                type="password"
                style={{}}
              />
              <p hidden={!isSignUp} className="fieldset-legend">
                Must be at least 8 characters
              </p>
            </fieldset>

            {fetcher.data?.error && (
              <div role="alert" className="alert alert-error">
                <AlertCircle className="h-6 w-6 shrink-0 stroke-current" />
                <span>{fetcher.data.error}</span>
              </div>
            )}

            <button
              className="btn btn-primary mt-4 flex w-full items-center justify-center gap-2"
              name="isSignUp"
              type="submit"
              value={isSignUp.toString()}
              disabled={fetcher.state !== "idle"}
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
            </button>
          </fetcher.Form>
        </div>

        <div className="card-action text-center">
          <button
            className="btn btn-link"
            onClick={() => {
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

      <Footer isSignUp={isSignUp} />
    </div>
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
