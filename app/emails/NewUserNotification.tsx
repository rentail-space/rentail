import { Button, Section, Text } from "@react-email/components";
import type { User } from "prisma/generated/client";
import * as styles from "~/emails/styles";
import envVars from "~/lib/env";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails";

/**
 * Notify admin of new user creation.  This is only sent in production.
 *
 * @param user - The user that was created.
 */
export default async function sendNewUserNotification(user: User) {
  if (!envVars.isProduction) return;
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "New User Created",
    component: ({ subject }) => (
      <NewUserNotification user={user} subject={subject} />
    ),
  });
}

function NewUserNotification({
  user,
  subject,
}: {
  user: User;
  subject: string;
}) {
  const url = `https://rentail.space/admin/user/${user.id}`;
  const utm = user.utm ? JSON.parse(user.utm as string) : undefined;
  const geocode = user.geocode ? JSON.parse(user.geocode as string) : undefined;
  return (
    <EmailLayout subject={subject}>
      <Section>
        <Text style={styles.text}>
          <strong>Name:</strong> {user.name}
        </Text>
        <Text style={styles.text}>
          <strong>Email:</strong> {user.email}
        </Text>
        <Text style={styles.text}>
          <strong>Location:</strong> {geocode.displayName ?? "N/A"}
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
              ([key]) =>
                key !== "ip" && key !== "userAgent" && key !== "referer",
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

      <Section style={styles.text}>
        <Button href={url} style={styles.button}>
          View User in Admin Panel
        </Button>
      </Section>
    </EmailLayout>
  );
}
