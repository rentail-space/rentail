import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import { Resend } from "resend";
import Welcome from "~/emails/Welcome";
import env from "./env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  try {
    const subject = `Welcome to rentail.space, ${name}! 🎉`;
    const html = await pretty(await render(<Welcome name={name} />));

    const { error } = await resend.emails.send({
      from: "Rentail <hello@rentail.space>",
      html,
      subject,
      to: [email],
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      captureException(error);
      return { success: false, error };
    }

    console.info(`Welcome email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    captureException(error);
    return { success: false, error };
  }
}