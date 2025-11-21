import { captureException } from "@sentry/react-router";
import { Activity, useState } from "react";
import { data, redirect, useLoaderData } from "react-router";
import { twMerge } from "tailwind-merge";
import authServer from "~/lib/auth.server";
import { findUserAndLastChat } from "~/sessions.server";
import ProfileEmailForm from "./ProfileEmailForm";
import ProfileNameForm from "./ProfileNameForm";
import ProfilePasswordForm from "./ProfilePasswordForm";

export async function loader({ request }: { request: Request }) {
  const root = await findUserAndLastChat(request.headers);
  if (!root || root.user.isAnonymous) throw redirect("/auth");
  return { user: root.user };
}

export async function action({ request }: { request: Request }) {
  const root = await findUserAndLastChat(request.headers);
  if (!root || root.user.isAnonymous) throw redirect("/auth");

  const form = await request.formData();
  const name = form.get("name")?.toString();
  if (name) return await updateName({ user: root.user, name, request });

  const email = form.get("email")?.toString();
  if (email)
    return await sendVerificationEmail({ email, request, user: root.user });

  const currentPassword = form.get("currentPassword")?.toString();
  const newPassword = form.get("newPassword")?.toString();
  const confirmPassword = form.get("confirmPassword")?.toString();
  if (currentPassword && newPassword && confirmPassword)
    return await changePassword({
      confirmPassword,
      currentPassword,
      newPassword,
      request,
      user: root.user,
    });

  return { error: "No action to perform" };
}

async function updateName({
  user,
  name,
  request,
}: {
  user: { id: string };
  name: string;
  request: Request;
}) {
  console.info("Updating name for user %s", user.id);
  try {
    const { headers } = await authServer.api.updateUser({
      body: { name },
      headers: request.headers,
      returnHeaders: true,
    });
    return data({ success: "Name updated successfully" }, { headers });
  } catch (error) {
    captureException(error);
    console.error("Error updating name for user %s: %s", user.id, error);
    return { error: "I cannot update your name" };
  }
}

async function sendVerificationEmail({
  email,
  request,
  user,
}: {
  email: string;
  request: Request;
  user: { id: string };
}) {
  console.info("Sending verification email to user %s", user.id);
  try {
    const { headers } = await authServer.api.sendVerificationEmail({
      body: {
        callbackURL: new URL("/profile", request.url).toString(),
        email,
      },
      headers: request.headers,
      returnHeaders: true,
    });
    return data({ success: "Verification email sent" }, { headers });
  } catch (error) {
    captureException(error);
    console.error(
      "Error sending verification email to user %s: %s",
      user.id,
      error,
    );
    return { error: "I cannot send you a verification email" };
  }
}

async function changePassword({
  user,
  confirmPassword,
  currentPassword,
  newPassword,
  request,
}: {
  user: { id: string };
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
  request: Request;
}) {
  console.info("Changing password for user %s", user.id);

  if (newPassword.length < 8)
    return { error: "Your new password must be at least 8 characters long" };
  if (newPassword !== confirmPassword)
    return { error: "Your new password and confirmation do not match" };

  try {
    const { headers } = await authServer.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: request.headers,
      returnHeaders: true,
    });
    return data({ success: "Password changed successfully" }, { headers });
  } catch (error) {
    captureException(error);
    console.error("Error changing password for user %s: %s", user.id, error);
    return { error: "Your current password is incorrect, please try again" };
  }
}

const tabs = [
  {
    label: "Name",
    key: "name",
    component: ProfileNameForm,
  },
  {
    label: "Email",
    key: "email",
    component: ProfileEmailForm,
  },
  {
    label: "Password",
    key: "password",
    component: ProfilePasswordForm,
  },
];

export default function ProfilePage() {
  const { user } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[0]["key"]>(
    tabs[0].key,
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="card card-border mx-auto max-w-2xl rounded-lg bg-white shadow-lg">
        <div className="card-body">
          <h1 className="font-bold text-3xl text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="card-body flex flex-col gap-8">
          <div role="tablist" className="tabs tabs-border">
            {tabs.map((tab) => (
              <button
                className={twMerge(
                  "tab",
                  activeTab === tab.key && "tab-active",
                )}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tabs.map((tab) => (
            <Activity
              key={tab.key}
              mode={activeTab === tab.key ? "visible" : "hidden"}
            >
              <tab.component user={user} />
            </Activity>
          ))}
        </div>
      </div>
    </div>
  );
}
