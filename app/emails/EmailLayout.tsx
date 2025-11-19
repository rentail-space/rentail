import {
  Body,
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
import * as styles from "~/emails/styles";

/**
 * EmailLayout is a component that wraps the email content and provides a consistent layout.
 * It is used to ensure that all emails have the same layout and consistent styling.
 *
 * @param children - The content of the email.
 * @param isCustomer - Whether the email is for a customer. Defaults to true.
 * @param preview - The preview text of the email. If not provided, the subject will be used.
 * @param subject - The subject of the email.
 * @returns The HTML email.
 */
export default function EmailLayout({
  children,
  isCustomer = true,
  preview,
  subject,
}: {
  children: React.ReactNode;
  isCustomer?: boolean;
  preview?: string;
  subject: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview ?? subject}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Header subject={subject} />
          {children}
          <Footer isCustomer={isCustomer} />
        </Container>
      </Body>
    </Html>
  );
}

function Header({ subject }: { subject: string }) {
  return (
    <Section>
      <Img
        alt="Rentail.space Logo"
        height="80"
        src="https://rentail.space/images/logo.png"
        style={styles.logo}
        width="80"
      />

      <Heading style={styles.heading}>{subject}</Heading>
    </Section>
  );
}

function Footer({ isCustomer = true }: { isCustomer: boolean }) {
  return (
    <Section style={styles.footer}>
      {isCustomer && (
        <Text style={styles.footerText}>
          You're receiving this email because you signed up for an account at{" "}
          <Link href="https://rentail.space" style={styles.footerLink}>
            rentail.space
          </Link>
        </Text>
      )}
      <Text style={styles.footerText}>
        <Link href="https://rentail.space/privacy" style={styles.footerLink}>
          Privacy Policy
        </Link>{" "}
        •{" "}
        <Link href="https://rentail.space/terms" style={styles.footerLink}>
          Terms of Service
        </Link>
      </Text>
    </Section>
  );
}
