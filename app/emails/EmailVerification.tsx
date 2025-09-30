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

interface EmailVerificationProps {
  name: string;
  verificationUrl: string;
}

export default function EmailVerification({
  name,
  verificationUrl,
}: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your new email address for rentail.space</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            alt="Rentail Logo"
            height="80"
            src="https://rentail.space/favicon-96x96.png"
            style={logo}
            width="80"
          />

          <Heading style={h1}>Verify Your Email Address</Heading>

          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            You recently requested to change your email address on
            rentail.space. To complete this change, please verify your new
            email address by clicking the button below.
          </Text>

          <Section style={buttonContainer}>
            <Button href={verificationUrl} style={button}>
              Verify Email Address
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>

          <Text style={code}>{verificationUrl}</Text>

          <Text style={text}>
            This link will expire in 24 hours. If you didn't request this
            change, you can safely ignore this email.
          </Text>

          <Text style={text}>
            Best regards,
            <br />
            The rentail.space Team
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://rentail.space" style={footerLink}>
                rentail.space
              </Link>{" "}
              •{" "}
              <Link href="https://rentail.space/privacy" style={footerLink}>
                Privacy
              </Link>{" "}
              •{" "}
              <Link href="https://rentail.space/terms" style={footerLink}>
                Terms
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  borderRadius: "8px",
  margin: "40px auto",
  padding: "40px",
  maxWidth: "600px",
};

const logo = {
  margin: "0 auto 32px",
  display: "block",
};

const h1 = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "16px 0",
};

const buttonContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "1",
  padding: "14px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const code = {
  backgroundColor: "#f3f4f6",
  borderRadius: "4px",
  color: "#1f2937",
  fontSize: "14px",
  fontFamily: "monospace",
  padding: "12px",
  wordBreak: "break-all" as const,
};

const footer = {
  borderTop: "1px solid #e5e7eb",
  marginTop: "32px",
  paddingTop: "24px",
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "8px 0",
  textAlign: "center" as const,
};

const footerLink = {
  color: "#6b7280",
  textDecoration: "underline",
};