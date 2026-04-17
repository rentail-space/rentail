import { Button, Section, Text } from "react-email";
import * as styles from "~/emails/styles";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails.server";

export default async function sendVerificationEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) {
  await sendEmail({
    email,
    subject: "Verify your email address for rentail.space",
    content: ({ subject }) => (
      <EmailVerification name={name} subject={subject} url={url} />
    ),
  });
}

function EmailVerification({
  name,
  subject,
  url: verificationUrl,
}: {
  name: string;
  subject: string;
  url: string;
}) {
  return (
    <EmailLayout subject={subject}>
      <Text style={styles.text}>Hi {name},</Text>

      <Text style={styles.text}>
        You recently requested to change your email address on rentail.space. To
        complete this change, please verify your new email address by clicking
        the button below.
      </Text>

      <Section style={styles.buttonContainer}>
        <Button href={verificationUrl} style={styles.button}>
          Verify Email Address
        </Button>
      </Section>

      <Text style={styles.text}>
        Or copy and paste this link into your browser:
      </Text>

      <Text style={styles.code}>{verificationUrl}</Text>

      <Text style={styles.text}>
        This link will expire in 24 hours. If you didn't request this change,
        you can safely ignore this email.
      </Text>

      <Text style={styles.text}>
        Best regards,
        <br />
        The rentail.space Team
      </Text>
    </EmailLayout>
  );
}
