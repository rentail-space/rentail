import { Button, Section, Text } from "@react-email/components";
import type { User } from "prisma/generated/client";
import * as styles from "~/emails/styles";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails";

export default async function sendNewUserEmail({ user }: { user: User }) {
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
          <strong>Location:</strong> {user.cityStateCountry}
        </Text>

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
