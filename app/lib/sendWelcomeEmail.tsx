import Welcome from "~/emails/Welcome";
import { sendEmail } from "~/lib/resend";

export default async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  await sendEmail({
    email,
    subject: `Welcome to rentail.space, ${name}! 🎉`,
    component: ({ subject }) => <Welcome name={name} subject={subject} />,
  });
}
