import EmailVerification from "~/emails/EmailVerification";
import { sendEmail } from "~/lib/resend";

export default async function sendVerificationEmail({
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
