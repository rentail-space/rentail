import { Button, Heading, Section, Text } from "@react-email/components";
import * as styles from "~/emails/styles";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails";

export default async function sendWaitlistLaunchEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  await sendEmail({
    email,
    subject: "Rentail.space is Now Live!",
    component: ({ subject }) => (
      <WaitlistLaunchEmail name={name} subject={subject} />
    ),
  });
}

function WaitlistLaunchEmail({
  name,
  subject,
}: {
  name: string;
  subject: string;
}) {
  return (
    <EmailLayout subject={subject}>
      <Text style={styles.text}>Hi {name},</Text>

      <Text style={styles.text}>
        Great news! Rentail.space has officially launched, and we're excited to
        have you as one of our first users.
      </Text>

      <Text style={styles.text}>
        Rentail is your AI-powered assistant for finding short-term retail
        spaces in shopping centers across the country. Whether you're looking to
        test a new product, run a seasonal pop-up, or expand your business, we
        make it easy to discover the perfect space.
      </Text>

      <Heading className="mb-6 text-center font-bold text-gray-800 text-xl leading-snug">
        Find Your Next Mall Space in Under 2 Minutes
      </Heading>

      <Text style={styles.text}>
        Simply chat with our AI to discover spaces that match your needs—from
        location and budget to foot traffic and demographics.
      </Text>

      <Section style={styles.buttonContainer}>
        <Button href="https://rentail.space/chat" style={styles.button}>
          Start Searching Now
        </Button>
      </Section>

      <Text style={styles.text}>
        Thank you for joining our waitlist. We can't wait to help you find your
        next retail opportunity.
      </Text>

      <Text style={styles.text}>
        Best regards,
        <br />
        The Rentail.space Team
      </Text>
    </EmailLayout>
  );
}
