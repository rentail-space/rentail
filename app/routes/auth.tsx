import { useId, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import Header from "~/components/layout/Header";
import { authClient } from "~/lib/auth.client";

export default function AuthPage() {
  const navigate = useNavigate();
  const { data: session } = authClient?.useSession?.() ?? { data: null };
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nameId = `name-${useId()}`;
  const emailId = `email-${useId()}`;
  const passwordId = `password-${useId()}`;

  // Redirect if already authenticated
  if (session) return <Navigate to="/chat" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({ email, password, name });

        if (result.error) {
          setError(result.error.message || "Failed to sign up");
          setIsLoading(false);
          return;
        }

        // Sign up successful, redirect to chat
        navigate("/chat");
      } else {
        const result = await authClient.signIn.email({ email, password });

        if (result.error) {
          setError(result.error.message || "Failed to sign in");
          setIsLoading(false);
          return;
        }

        // Sign in successful, redirect to chat
        navigate("/chat");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <>
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="mt-2 text-gray-600">
                {isSignUp
                  ? "Sign up to start finding retail spaces"
                  : "Sign in to your account"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <label
                    htmlFor={nameId}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id={nameId}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor={emailId}
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id={emailId}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor={passwordId}
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  type="password"
                  id={passwordId}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                {isSignUp && (
                  <p className="mt-1 text-sm text-gray-500">
                    Must be at least 8 characters
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                {isLoading
                  ? "Loading..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            By signing up, you agree to our{" "}
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
    </>
  );
}
