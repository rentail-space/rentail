import { captureException } from "@sentry/react-router";
import bcrypt from "bcrypt";
import { invariant } from "es-toolkit";
import type { User } from "prisma/generated/client";
import { useState } from "react";
import { redirect, useLoaderData } from "react-router";
import { ulid } from "ulid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import sendVerificationEmail from "~/emails/EmailVerification";
import prisma from "~/lib/prisma";
import { findUserAndLastChat } from "~/lib/sessions.server";
import ProfileEmailForm from "./ProfileEmailForm";
import ProfileNameForm from "./ProfileNameForm";
import ProfilePasswordForm from "./ProfilePasswordForm";

export const handle = { headerLinks: [] };

export async function loader({ request }: { request: Request }) {
  const user = await getSignedInUser(request);
  return { user };
}

export async function action({ request }: { request: Request }) {
  const user = await getSignedInUser(request);
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

/**
 * Get the signed in user from the request. If the user is not signed in, redirect to
 * the sign in page.
 *
 * @param request - The request object
 * @returns The signed in user.
 * @throws {Response} 302 Redirect to the sign in page if the user is not signed in.
 */
async function getSignedInUser(request: Request): Promise<User> {
  const user = await findUserAndLastChat(request);
  if (!("user" in user) || user.user.isAnonymous) throw redirect("/auth");
  return user.user;
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
    const verification = await prisma.verification.create({
      data: {
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
        id: ulid(),
        identifier: user.id,
        value: newEmail,
      },
    });
    await sendVerificationEmail({
      email: newEmail,
      name: user.name,
      url: new URL(`/email/verify/${verification.id}`, request.url).toString(),
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
  if (
    !(await bcrypt.compare(currentPassword, user.passwordHash ?? "anonymous"))
  )
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
    <main className="container min-h-screen bg-[hsl(60,100%,99%)] px-5 py-12 sm:px-6 lg:px-8">
      <title>
        Profile Settings - Specialty Leasing & Retail Spaces | Rentail.space
      </title>
      <meta
        name="description"
        content="Manage your account information and settings."
      />
      <meta
        name="keywords"
        content="profile settings, retail spaces, rentail.space"
      />

      <div className="mx-auto max-w-2xl rounded-md border-2 border-black bg-white shadow-[8px_8px_0px_0px_black]">
        <div className="border-black border-b-2 p-8">
          <h1 className="mb-2 font-bold text-3xl text-black">
            Profile Settings
          </h1>
          <p className="font-medium text-black">
            Manage your account information
          </p>
        </div>

        <div className="flex flex-col gap-8 p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent className="mt-8" value={tab.key} key={tab.key}>
                <tab.component user={user} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </main>
  );
}
