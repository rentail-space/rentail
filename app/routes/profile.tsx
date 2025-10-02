import { useId, useState } from "react";
import { Navigate } from "react-router";
import authClient from "~/lib/auth.client";

export default function ProfilePage() {
  const session = authClient?.useSession?.().data ?? null;
  const isPending = authClient?.useSession?.().isPending ?? true;

  // Redirect if not authenticated
  if (!isPending && (!session || session.user.isAnonymous))
    return <Navigate to="/auth" replace />;
  else if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  } else return <ProfileTabs user={session.user} />;
}

function ProfileTabs({ user }: { user: { name: string; email: string } }) {
  const [activeTab, setActiveTab] = useState<"name" | "email" | "password">(
    "name",
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="mb-8 text-gray-600">Manage your account information</p>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab("name")}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === "name"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Name
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === "email"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Email Address
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === "password"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Password
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "name" && <NameForm user={user} />}
          {activeTab === "email" && <EmailForm user={user} />}
          {activeTab === "password" && <PasswordForm />}
        </div>
      </div>
    </div>
  );
}

function NameForm({ user }: { user: { name: string; email: string } }) {
  const [name, setName] = useState(user.name || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nameId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Name updated successfully!");
        // Refresh the page to show updated name in header
        setTimeout(() => window.location.reload(), 1000);
      } else setError(result.error?.message || "Failed to update name");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="John Doe"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || name === user.name}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {isLoading ? "Updating..." : "Update Name"}
      </button>
    </form>
  );
}

function EmailForm({ user }: { user: { name: string; email: string } }) {
  const [email, setEmail] = useState(user.email || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const emailId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Update email via Better Auth API
      const response = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, emailVerified: false }),
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        // Now trigger email verification
        const verifyResponse = await fetch(
          "/api/auth/send-verification-email",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          },
        );

        if (verifyResponse.ok) {
          setVerificationSent(true);
          setSuccess(
            "Email updated! A verification link has been sent to your new email address. You must verify your email before you can sign in with it.",
          );
        } else {
          setError("Email updated but failed to send verification email");
        }
      } else setError(result.error?.message || "Failed to update email");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Current email:</strong> {user.email}
        </p>
      </div>

      {verificationSent && (
        <div className="rounded-lg bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            A verification link has been sent to your new email address. You
            must verify your email before you can sign in with it.
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor={emailId}
          className="block text-sm font-medium text-gray-700"
        >
          New Email Address
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
        <p className="mt-1 text-sm text-gray-500">
          You'll need to verify your new email before you can use it to sign in.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || email === user.email || verificationSent}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {isLoading ? "Sending verification..." : "Change Email"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess("Password changed successfully!");
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else setError(result.error?.message || "Failed to change password");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor={currentPasswordId}
          className="block text-sm font-medium text-gray-700"
        >
          Current Password
        </label>
        <input
          type="password"
          id={currentPasswordId}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label
          htmlFor={newPasswordId}
          className="block text-sm font-medium text-gray-700"
        >
          New Password
        </label>
        <input
          type="password"
          id={newPasswordId}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
        <p className="mt-1 text-sm text-gray-500">
          Must be at least 8 characters
        </p>
      </div>

      <div>
        <label
          htmlFor={confirmPasswordId}
          className="block text-sm font-medium text-gray-700"
        >
          Confirm New Password
        </label>
        <input
          type="password"
          id={confirmPasswordId}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {isLoading ? "Changing password..." : "Change Password"}
      </button>
    </form>
  );
}
