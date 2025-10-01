import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as styles from "./styles";

export default function Waitlist({ subject }: { subject: string }) {
  return (
    <Html>
      <Head />
      <Preview>You're on the waitlist for Rentail</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Img
            alt="Rentail Logo"
            height="80"
            src="https://rentail.space/favicon-96x96.png"
            style={styles.logo}
            width="80"
          />

          <Heading style={styles.heading}>{subject}</Heading>

          <Section>
            <Text style={styles.text}>
              🚀 Rentail helps you find a retail space in a shopping center.
              Grow your business in a few easy steps.
            </Text>
            <Text style={styles.text}>
              🛳 We are launching soon, and we'll send you an email when we do.
            </Text>
            <Text style={styles.text}>
              No worries! Your data is completely safe and will only be utilized
              to provide you with updates about our product.
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Thanks for your interest in rentail.space!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
