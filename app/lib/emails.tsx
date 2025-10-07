import EmailVerification from "~/emails/EmailVerification";
import Welcome from "~/emails/Welcome";
import { sendEmail } from "~/lib/resend";

export async function sendWelcomeEmail({
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

export async function sendVerificationEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) {
  const subject = "Verify your email address for rentail.space";
  await sendEmail({
    email,
    subject,
    component: ({ subject }) => (
      <EmailVerification name={name} subject={subject} verificationUrl={url} />
    ),
  });
}
