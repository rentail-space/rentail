import type { User } from "prisma/generated";
import { Button, Section, Text } from "react-email";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails.server";

/**
 * Notify admin of new user creation.  This is only sent in production.
 *
 * @param user - The user that was created.
 */
export default async function sendNewUserNotification(user: User) {
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "New User Created",
    content: ({ subject }) => (
      <EmailLayout subject={subject}>
        <UserInfo user={user} />
        <LinkToUser user={user} />
      </EmailLayout>
    ),
  });
}

function UserInfo({ user }: { user: User }) {
  const utm = user.utm ? JSON.parse(user.utm as string) : undefined;
  const workingMemory = cleanParseWorkingMemory(user.workingMemory);
  return (
    <Section>
      <Text className="text-gray-700 text-sm leading-relaxed">
        <strong>Name:</strong> {user.name}
      </Text>
      <Text className="text-gray-700 text-sm leading-relaxed">
        <strong>Email:</strong> {user.email}
      </Text>
      <Text className="text-gray-700 text-sm leading-relaxed">
        <strong>Is Anonymous:</strong> {user.isAnonymous ? "Yes" : "No"}
      </Text>
      <Text className="text-gray-700 text-sm leading-relaxed">
        <strong>Location:</strong>{" "}
        {workingMemory?.location?.displayName ?? "N/A"}
      </Text>
      <Text className="text-gray-700 text-sm leading-relaxed">
        <strong>Referrer:</strong> {user.referrer ?? "N/A"}
      </Text>
      <Text className="text-gray-700 text-sm leading-relaxed">
        <strong>User Agent:</strong> {user.userAgent ?? "N/A"}
      </Text>
      {utm &&
        Object.entries<string>(utm)
          .filter(
            ([key]) => key !== "ip" && key !== "userAgent" && key !== "referer",
          )
          .map(([key, value]) => (
            <Text key={key} className="text-gray-700 text-sm leading-relaxed">
              <strong>UTM {key}:</strong> {value}
            </Text>
          ))}
    </Section>
  );
}

function LinkToUser({ user }: { user: User }) {
  return (
    <Section className="mb-4 text-center">
      <Button
        href={`https://rentail.space/admin/user/${user.id}`}
        className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium"
      >
        View User in Admin Panel
      </Button>
    </Section>
  );
}
