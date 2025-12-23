import { Button, Section, Text } from "@react-email/components";
import type { User } from "prisma/generated/client";
import * as styles from "~/emails/styles";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails";

/**
 * Notify admin of new user creation.  This is only sent in production.
 *
 * @param user - The user that was created.
 */
export default async function sendNewUserNotification(user: User) {
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "New User Created",
    component: ({ subject }) => (
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
      <Text style={styles.text}>
        <strong>Name:</strong> {user.name}
      </Text>
      <Text style={styles.text}>
        <strong>Email:</strong> {user.email}
      </Text>
      <Text style={styles.text}>
        <strong>Location:</strong>{" "}
        {workingMemory?.location?.displayName ?? "N/A"}
      </Text>
      <Text style={styles.text}>
        <strong>Referrer:</strong> {user.referrer ?? "N/A"}
      </Text>
      <Text style={styles.text}>
        <strong>User Agent:</strong> {user.userAgent ?? "N/A"}
      </Text>
      {utm &&
        Object.entries<string>(utm)
          .filter(
            ([key]) => key !== "ip" && key !== "userAgent" && key !== "referer",
          )
          .map(([key, value]) => (
            <Text key={key} style={styles.text}>
              <strong>UTM {key}:</strong> {value}
            </Text>
          ))}

      <Text style={styles.text}>
        <strong>Memory:</strong>
      </Text>
      <pre style={styles.code}>
        {JSON.stringify(JSON.parse(user.workingMemory), null, 2)}
      </pre>
    </Section>
  );
}

function LinkToUser({ user }: { user: User }) {
  return (
    <Section style={styles.text}>
      <Button
        href={`https://rentail.space/admin/user/${user.id}`}
        style={styles.button}
      >
        View User in Admin Panel
      </Button>
    </Section>
  );
}
