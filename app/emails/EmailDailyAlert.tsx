import { Button, Section, Text } from "@react-email/components";
import type { User } from "prisma/generated/client";
import { ulid } from "ulid";
import * as styles from "~/emails/styles";
import prisma from "~/lib/prisma.server";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails.server";

export default async function sendDailyAlertEmail({
  center,
  helpful,
  message,
  space,
  subject,
  user,
}: {
  center?: string;
  helpful: boolean;
  message: string;
  space?: string;
  subject: string;
  user: User;
}) {
  if (helpful)
    await prisma.followUp.create({
      data: {
        id: ulid(),
        message,
        subject,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

  await sendEmail({
    email: "assaf@labnotes.org",
    subject,
    content: ({ subject }) => (
      <EmailDailyAlert
        center={center}
        helpful={helpful}
        message={message}
        space={space}
        subject={subject}
      />
    ),
  });
}

function EmailDailyAlert({
  center,
  helpful,
  message,
  space,
  subject,
}: {
  center?: string;
  helpful: boolean;
  message: string;
  space?: string;
  subject: string;
}) {
  const url = "https://rentail.space/chat";
  return (
    <EmailLayout subject={subject}>
      <Text style={styles.text}>{message}</Text>

      <Section style={styles.buttonContainer}>
        <Button href={url} style={styles.button}>
          Continue Chat
        </Button>
      </Section>

      <Section>
        <Text style={styles.text}>
          <strong>Center:</strong> {center}
        </Text>
        <Text style={styles.text}>
          <strong>Space:</strong> {space}
        </Text>
        <Text style={styles.text}>
          <strong>Helpful:</strong> {helpful ? "Yes" : "No"}
        </Text>
      </Section>
    </EmailLayout>
  );
}
