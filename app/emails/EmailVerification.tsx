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

export default function EmailVerification({
  name,
  preview,
  verificationUrl,
}: {
  name: string;
  preview: string;
  verificationUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Img
            alt="Rentail Logo"
            height="80"
            src="https://rentail.space/favicon-96x96.png"
            style={styles.logo}
            width="80"
          />

          <Heading style={styles.heading}>Verify Your Email Address</Heading>

          <Text style={styles.text}>Hi {name},</Text>

          <Text style={styles.text}>
            You recently requested to change your email address on
            rentail.space. To complete this change, please verify your new email
            address by clicking the button below.
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
            This link will expire in 24 hours. If you didn't request this
            change, you can safely ignore this email.
          </Text>

          <Text style={styles.text}>
            Best regards,
            <br />
            The rentail.space Team
          </Text>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              <Link href="https://rentail.space" style={styles.footerLink}>
                rentail.space
              </Link>{" "}
              •{" "}
              <Link
                href="https://rentail.space/privacy"
                style={styles.footerLink}
              >
                Privacy
              </Link>{" "}
              •{" "}
              <Link
                href="https://rentail.space/terms"
                style={styles.footerLink}
              >
                Terms
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
