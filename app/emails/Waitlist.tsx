import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export default function Waitlist({ subject }: { subject: string }) {
  return (
    <Html>
      <Head />
      <Preview>You're on the waitlist for Rentail</Preview>
      <Body
        style={{
          backgroundColor: "#f6f9fc",
          padding: "10px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #f0f0f0",
            padding: "45px",
          }}
        >
          <Img
            alt="Logo"
            height="100"
            src="https://rentail.space/favicon-96x96.png"
            style={{ paddingTop: "40px", margin: "0 auto" }}
            width="100"
          />
          <Section>
            <Text style={text}>{subject}</Text>
            <Text style={text}>
              🚀 Rentail helps you find a retail space in a shopping center.
              Grow your business in a few easy steps.
            </Text>
            <Text style={text}>
              🛳 We are launching soon, and we'll send you an email when we do.
            </Text>
            <Text style={text}>
              No worries! your data is completely safe and will only be utilized
              to provide you with updates about our product.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const text = {
  fontSize: "16px",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: "400",
  color: "#404040",
  lineHeight: "26px",
  // padding: "0 40px",
};
