import { Section, Text } from "@react-email/components";
import * as styles from "~/emails/styles";
import EmailLayout from "./EmailLayout";

export default function Waitlist({ subject }: { subject: string }) {
  return (
    <EmailLayout subject={subject}>
      <Section>
        <Text style={styles.text}>
          🚀 Rentail.space helps you find a retail space in a shopping center.
          Grow your business in a few easy steps.
        </Text>
        <Text style={styles.text}>
          🛳 We are launching soon, and we'll send you an email when we do.
        </Text>
        <Text style={styles.text}>
          No worries! Your data is completely safe and will only be utilized to
          provide you with updates about our product.
        </Text>
      </Section>

      <Section style={styles.footer}>
        <Text style={styles.footerText}>
          Thanks for your interest in rentail.space!
        </Text>
      </Section>
    </EmailLayout>
  );
}
