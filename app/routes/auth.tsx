import { AlertCircle } from "lucide-react";
import { redirect, useFetcher } from "react-router";
import { CircularLoading } from "respinner";
import invariant from "tiny-invariant";
import { useToggle } from "usehooks-ts";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Button } from "~/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
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

function getStringFormValue(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : undefined;
}

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const form = await request.formData();
  try {
    const email = getStringFormValue(form, "email")?.trim().toLowerCase();
    const password = getStringFormValue(form, "password")?.trim();
    invariant(email, "Email is required");
    invariant(password, "Password is required");

    if (form.has("name")) {
      const name = getStringFormValue(form, "name")?.trim() ?? "Anonymous";
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
  const fetcher = useFetcher();

  return (
    <main className="flex flex-col items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <title>Sign Up or Sign In | Rentail.space</title>
      <meta
        name="description"
        content="Sign up or sign in to your account to start finding retail spaces."
      />
      <meta
        name="keywords"
        content="sign up, sign in, retail spaces, rentail.space"
      />
      <link rel="canonical" href="https://rentail.space/auth" />

      <Card className="mx-4 my-10 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-bold text-3xl">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Sign up to start finding retail spaces"
              : "Sign in to your account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <fetcher.Form method="post" className="space-y-6">
            <FieldSet>
              {isSignUp && (
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                  style={{}}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  minLength={8}
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  style={{}}
                />
                <FieldDescription>
                  Must be at least 8 characters
                </FieldDescription>
              </Field>
            </FieldSet>

            {fetcher.data?.error && (
              <FieldError errors={[fetcher.data.error]}>
                <div className="flex items-center gap-2 font-bold text-lg text-red-500">
                  <AlertCircle className="h-6 w-6 shrink-0 stroke-current" />
                  {fetcher.data.error}
                </div>
              </FieldError>
            )}

            <Button
              className="w-full p-6 font-bold text-lg"
              disabled={fetcher.state !== "idle"}
              type="submit"
              variant="default"
            >
              {fetcher.state !== "idle" && (
                <CircularLoading size={40} color="#888" strokeWidth={8} />
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
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-4 text-center">
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
          <p>
            By {isSignUp ? "signing up" : "signing in"}, you agree to our{" "}
            <ActiveLink to="/terms">Terms of Service</ActiveLink> and{" "}
            <ActiveLink to="/privacy">Privacy Policy</ActiveLink>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
