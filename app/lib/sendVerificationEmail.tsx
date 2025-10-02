import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import EmailVerification from "~/emails/EmailVerification";
import resend from "~/lib/resend";

export default async function sendVerificationEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) {
  try {
    const subject = "Verify your email address for rentail.space";
    const html = await pretty(
      await render(
        <EmailVerification
          name={name}
          verificationUrl={url}
          preview={subject}
        />,
      ),
    );

    const { error } = await resend.emails.send({
      from: "Rentail <hello@rentail.space>",
      html,
      subject,
      to: [email],
    });
    if (error) throw error;

    console.info(`[EMAIL] Verification email sent to ${email}`);
  } catch (error) {
    console.error("[EMAIL] Error sending verification email:", error);
    captureException(error, { extra: { email } });
  }
}
