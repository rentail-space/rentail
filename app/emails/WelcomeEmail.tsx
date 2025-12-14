import { Button, Link, Section, Text } from "@react-email/components";
import * as styles from "~/emails/styles";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails";
import type { User } from "prisma/generated/client";

/**
 * Send a welcome email to a new user.  This is only sent to authenticated
 * users.
 *
 * @param user - The user to send the welcome email to.
 */
export default async function sendWelcomeEmail(user: User) {
  if (user.isAnonymous) return;
  await sendEmail({
    component: ({ subject }) => (
      <Welcome name={user.name ?? ""} subject={subject} />
    ),
    email: user.email ?? "",
    subject: "Welcome to rentail.space! 🎉",
  });
}

function Welcome({ name, subject }: { name: string; subject: string }) {
  return (
    <EmailLayout subject={subject}>
      <Text style={styles.text}>Hi {name},</Text>

      <Text style={styles.text}>
        Thanks for signing up! We're excited to have you on board and help you
        find the perfect retail space for your business.
      </Text>

      <Section style={styles.highlightBox}>
        <Text style={styles.highlightText}>
          🏢 Discover specialty leasing opportunities
          <br />🤖 AI-powered recommendations tailored to your needs
          <br />💬 Interactive chat to answer all your questions
          <br />📍 Location-based search with detailed property info
        </Text>
      </Section>

      <Text style={styles.text}>
        Our platform uses advanced AI to help you discover short-term retail
        spaces in shopping centers. Whether you're looking for a pop-up shop,
        seasonal kiosk, or specialty lease, we've got you covered.
      </Text>

      <Section style={styles.buttonContainer}>
        <Button href="https://rentail.space/chat" style={styles.button}>
          Start Finding Spaces
        </Button>
      </Section>

      <Text style={styles.text}>
        Need help getting started? Just head to our{" "}
        <Link href="https://rentail.space/chat" style={styles.link}>
          chat page
        </Link>{" "}
        and ask our AI assistant any questions you have.
      </Text>

      <Text style={styles.text}>
        If you have any questions or feedback, feel free to reply to this email.
        We'd love to hear from you!
      </Text>

      <Text style={styles.text}>
        Happy space hunting! 🚀
        <br />
        The rentail.space Team
      </Text>
    </EmailLayout>
  );
}
