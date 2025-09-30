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

export default function Welcome({ name }: { name: string }) {
  const previewText = `Welcome to rentail.space, ${name}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            alt="Rentail Logo"
            height="80"
            src="https://rentail.space/favicon-96x96.png"
            style={logo}
            width="80"
          />

          <Heading style={h1}>Welcome to rentail.space! 🎉</Heading>

          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            Thanks for signing up! We're excited to have you on board and help
            you find the perfect retail space for your business.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              🏢 Discover specialty leasing opportunities
              <br />🤖 AI-powered recommendations tailored to your needs
              <br />💬 Interactive chat to answer all your questions
              <br />📍 Location-based search with detailed property info
            </Text>
          </Section>

          <Text style={text}>
            Our platform uses advanced AI to help you discover short-term retail
            spaces in shopping centers. Whether you're looking for a pop-up
            shop, seasonal kiosk, or specialty lease, we've got you covered.
          </Text>

          <Section style={buttonContainer}>
            <Button href="https://rentail.space/chat" style={button}>
              Start Finding Spaces
            </Button>
          </Section>

          <Text style={text}>
            Need help getting started? Just head to our{" "}
            <Link href="https://rentail.space/chat" style={link}>
              chat page
            </Link>{" "}
            and ask our AI assistant any questions you have.
          </Text>

          <Text style={text}>
            If you have any questions or feedback, feel free to reply to this
            email. We'd love to hear from you!
          </Text>

          <Text style={text}>
            Happy space hunting! 🚀
            <br />
            The rentail.space Team
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this email because you signed up for an account
              at{" "}
              <Link href="https://rentail.space" style={footerLink}>
                rentail.space
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href="https://rentail.space/privacy" style={footerLink}>
                Privacy Policy
              </Link>{" "}
              •{" "}
              <Link href="https://rentail.space/terms" style={footerLink}>
                Terms of Service
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

const highlightBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  padding: "20px",
  margin: "24px 0",
};

const highlightText = {
  color: "#1f2937",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
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

const link = {
  color: "#4f46e5",
  textDecoration: "underline",
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
