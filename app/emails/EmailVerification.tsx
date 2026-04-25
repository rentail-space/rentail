import { Button, Section, Text } from "react-email";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails.server";

export default async function sendVerificationEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) {
  await sendEmail({
    email,
    subject: "Verify your email address for rentail.space",
    content: ({ subject }) => (
      <EmailVerification name={name} subject={subject} url={url} />
    ),
  });
}

function EmailVerification({
  name,
  subject,
  url: verificationUrl,
}: {
  name: string;
  subject: string;
  url: string;
}) {
  return (
    <EmailLayout subject={subject}>
      <Text className="text-gray-700 text-sm leading-relaxed">Hi {name},</Text>

      <Text className="text-gray-700 text-sm leading-relaxed">
        You recently requested to change your email address on rentail.space. To
        complete this change, please verify your new email address by clicking
        the button below.
      </Text>

      <Section className="mb-4 text-center">
        <Button
          href={verificationUrl}
          className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium"
        >
          Verify Email Address
        </Button>
      </Section>

      <Text className="text-gray-700 text-sm leading-relaxed">
        Or copy and paste this link into your browser:
      </Text>

      <Text className="bg-gray-100 rounded-md p-2 font-mono break-all">
        {verificationUrl}
      </Text>

      <Text className="text-gray-700 text-sm leading-relaxed">
        This link will expire in 24 hours. If you didn't request this change,
        you can safely ignore this email.
      </Text>

      <Text className="text-gray-700 text-sm leading-relaxed">
        Best regards,
        <br />
        The rentail.space Team
      </Text>
    </EmailLayout>
  );
}
