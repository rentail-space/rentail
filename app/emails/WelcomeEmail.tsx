import type { User } from "prisma/generated";
import { Button, Link, Section, Text } from "react-email";
import EmailLayout from "./EmailLayout";
import { sendEmail } from "./sendEmails.server";

/**
 * Send a welcome email to a new user.  This is only sent to authenticated
 * users.
 *
 * @param user - The user to send the welcome email to.
 */
export default async function sendWelcomeEmail(user: User) {
  if (user.isAnonymous) return;
  await sendEmail({
    content: ({ subject }) => (
      <Welcome name={user.name ?? ""} subject={subject} />
    ),
    email: user.email ?? "",
    subject: "Welcome to rentail.space! 🎉",
  });
}

function Welcome({ name, subject }: { name: string; subject: string }) {
  return (
    <EmailLayout subject={subject}>
      <Text className="text-gray-700 text-sm leading-relaxed">Hi {name},</Text>

      <Text className="text-gray-700 text-sm leading-relaxed">
        Thanks for signing up! We're excited to have you on board and help you
        find the perfect retail space for your business.
      </Text>

      <Section className="bg-gray-100 rounded-md p-4">
        <Text className="text-gray-700 text-sm leading-relaxed">
          🏢 Discover specialty leasing opportunities
          <br />🤖 AI-powered recommendations tailored to your needs
          <br />💬 Interactive chat to answer all your questions
          <br />📍 Location-based search with detailed property info
        </Text>
      </Section>

      <Text className="text-gray-700 text-sm leading-relaxed">
        Our platform uses advanced AI to help you discover short-term retail
        spaces in shopping centers. Whether you're looking for a pop-up shop,
        seasonal kiosk, or specialty lease, we've got you covered.
      </Text>

      <Section className="mb-4 text-center">
        <Button
          href="https://rentail.space/chat"
          className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium"
        >
          Start Finding Spaces
        </Button>
      </Section>

      <Text className="text-gray-700 text-sm leading-relaxed">
        Need help getting started? Just head to our{" "}
        <Link
          href="https://rentail.space/chat"
          className="text-primary underline"
        >
          chat page
        </Link>{" "}
        and ask our AI assistant any questions you have.
      </Text>

      <Text className="text-gray-700 text-sm leading-relaxed">
        If you have any questions or feedback, feel free to reply to this email.
        We'd love to hear from you!
      </Text>

      <Text className="text-gray-700 text-sm leading-relaxed">
        Happy space hunting! 🚀
        <br />
        The rentail.space Team
      </Text>
    </EmailLayout>
  );
}
