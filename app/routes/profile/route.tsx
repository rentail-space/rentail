import { captureException } from "@sentry/react-router";
import bcrypt from "bcrypt";
import { invariant } from "es-toolkit";
import type { User } from "prisma/generated/client";
import { Activity, useState } from "react";
import { redirect, useLoaderData } from "react-router";
import { twMerge } from "tailwind-merge";
import { sendVerificationEmail } from "~/emails/sendEmails";
import prisma from "~/lib/prisma";
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
  const user = root.user;

  const form = await request.formData();
  const name = form.get("name")?.toString();
  if (name) return await updateName({ user, name });

  const email = form.get("email")?.toString();
  if (email) return await updateEmail({ newEmail: email, request, user });

  const currentPassword = form.get("currentPassword")?.toString();
  const newPassword = form.get("newPassword")?.toString();
  const confirmPassword = form.get("confirmPassword")?.toString();
  if (currentPassword && newPassword && confirmPassword)
    return await updatePassword({
      confirmPassword,
      currentPassword,
      newPassword,
      user,
    });

  return { error: "What did you want to update?" };
}

async function updateName({
  user,
  name,
}: {
  user: { id: string };
  name: string;
}) {
  console.info("Updating name for user %s", user.id);
  try {
    await prisma.user.update({
      data: { name },
      where: { id: user.id },
    });
    return { success: "Name updated successfully" };
  } catch (error) {
    captureException(error);
    console.error("Error updating name for user %s: %s", user.id, error);
    return { error: "I cannot update your name" };
  }
}

async function updateEmail({
  newEmail,
  request,
  user,
}: {
  newEmail: string;
  request: Request;
  user: User;
}) {
  console.info("Sending verification email to user %s", user.id);
  try {
    invariant(user.name, "User has no name");
    await sendVerificationEmail({
      email: newEmail,
      name: user.name,
      url: new URL("/email/verify", request.url).toString(),
    });
    return { success: "Verification email sent" };
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

async function updatePassword({
  confirmPassword,
  currentPassword,
  newPassword,
  user,
}: {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
  user: User;
}) {
  console.info("Changing password for user %s", user.id);

  if (newPassword.length < 8)
    return { error: "Your new password must be at least 8 characters long" };
  if (newPassword !== confirmPassword)
    return { error: "Your new password and confirmation do not match" };
  if (await bcrypt.compare(currentPassword, user.passwordHash ?? "anonymous"))
    return { error: "Your current password is incorrect, please try again" };

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      data: { passwordHash },
      where: { id: user.id },
    });
    return { success: "Password changed successfully" };
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
