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

export default function EmailLayout({
  subject,
  children,
}: {
  subject: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Header subject={subject} />
          {children}
          <Footer />
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

function Footer() {
  return (
    <Section style={styles.footer}>
      <Text style={styles.footerText}>
        You're receiving this email because you signed up for an account at{" "}
        <Link href="https://rentail.space" style={styles.footerLink}>
          rentail.space
        </Link>
      </Text>
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
