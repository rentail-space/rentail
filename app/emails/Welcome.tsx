import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as styles from "./styles";

export default function Welcome({ name }: { name: string }) {
  const previewText = `Welcome to rentail.space, ${name}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Img
            alt="Rentail Logo"
            height="80"
            src="https://rentail.space/favicon-96x96.png"
            style={styles.logo}
            width="80"
          />

          <Heading style={styles.heading}>Welcome to rentail.space! 🎉</Heading>

          <Text style={styles.text}>Hi {name},</Text>

          <Text style={styles.text}>
            Thanks for signing up! We're excited to have you on board and help
            you find the perfect retail space for your business.
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
            spaces in shopping centers. Whether you're looking for a pop-up
            shop, seasonal kiosk, or specialty lease, we've got you covered.
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
            If you have any questions or feedback, feel free to reply to this
            email. We'd love to hear from you!
          </Text>

          <Text style={styles.text}>
            Happy space hunting! 🚀
            <br />
            The rentail.space Team
          </Text>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              You're receiving this email because you signed up for an account
              at{" "}
              <Link href="https://rentail.space" style={styles.footerLink}>
                rentail.space
              </Link>
            </Text>
            <Text style={styles.footerText}>
              <Link
                href="https://rentail.space/privacy"
                style={styles.footerLink}
              >
                Privacy Policy
              </Link>{" "}
              •{" "}
              <Link
                href="https://rentail.space/terms"
                style={styles.footerLink}
              >
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
