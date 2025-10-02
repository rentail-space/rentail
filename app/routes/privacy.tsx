import { Streamdown } from "streamdown";

const policy = `
# Privacy Policy

Last Updated: 10/02/2025

## 1. Introduction

rentail.space ("we," "our," or "us") is committed to protecting your privacy.
This Privacy Policy explains how we collect, use, disclose, and safeguard your
information when you use our service.

## 2. Information We Collect

We collect information that you provide directly to us, including:

- Name and email address (when you create an account)
- Password (encrypted and securely stored)
- Communication preferences
- Any information you provide when using our chat service

## 3. How We Use Your Information

We use the information we collect to:

- Provide, maintain, and improve our services
- Personalize your experience and provide AI-powered recommendations
- Process your requests and respond to your inquiries
- Send you technical notices and support messages
- Monitor and analyze trends, usage, and activities
- Detect, prevent, and address technical issues
- Comply with legal obligations and protect our rights

## 4. AI and Data Processing

Our service uses artificial intelligence (Claude AI by Anthropic) to provide
personalized recommendations. Your chat conversations may be processed by our AI
systems to:

- Understand your retail space requirements and preferences
- Provide relevant property recommendations
- Improve the quality of our AI responses
- Maintain conversation context and history

We store chat histories to improve your experience across sessions. You can
request deletion of your chat history at any time.

## 5. Information Sharing and Disclosure

We do not sell your personal information. We may share your information in the
following circumstances:

- Service Providers: With third-party vendors who perform services on our behalf (e.g., hosting, analytics, AI processing)
- Legal Requirements: When required by law or to protect our rights
- Business Transfers: In connection with a merger, acquisition, or sale of assets
- With Your Consent: When you explicitly authorize us to share your information

## 6. Data Security

We implement appropriate technical and organizational measures to protect your
personal information, including:

- Encryption of data in transit and at rest
- Secure password hashing using industry standards
- Regular security assessments and monitoring
- Access controls and authentication requirements
- Error tracking and performance monitoring (via Sentry)

## 7. Cookies and Tracking Technologies

- Maintenance and monitoring of our systems
- Analyzing usage patterns and improving our service
- Tracking performance metrics
- Providing technical support and troubleshooting

## 8. Your Rights and Choices

Depending on your location, you may have the following rights:

- Access: Request access to your personal information
- Correction: Request correction of inaccurate data
- Deletion: Request deletion of your personal information
- Data Portability: Request a copy of your data in a structured format
- Opt-out: Unsubscribe from marketing communications
- Object: Object to certain processing of your data

To exercise these rights, please contact us at privacy@rentail.space

## 9. Data Retention

We retain your personal information for as long as necessary to provide our
services and fulfill the purposes outlined in this Privacy Policy. When you
delete your account, we will delete or anonymize your personal information,
except where we are required to retain it for legal purposes.

## 10. Children's Privacy

Our service is not intended for children under 13 years of age. We do not
knowingly collect personal information from children under 13. If you believe we
have collected information from a child under 13, please contact us immediately.

## 11. International Data Transfers

Your information may be transferred to and processed in countries other than
your country of residence. These countries may have data protection laws that
differ from those of your country. We take steps to ensure that your information
receives an adequate level of protection.

## 12. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any
material changes by posting the new Privacy Policy on this page and updating the
"Last Updated" date. You are advised to review this Privacy Policy periodically
for any changes.

## 13. Contact Us

If you have any questions about this Privacy Policy, please contact us at:

Email: [privacy@rentail.space](mailto:privacy@rentail.space)

By using rentail.space, you acknowledge that you have read, understood, and
agree to this Privacy Policy.
`;

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen  py-12 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 prose">
      <Streamdown>{policy}</Streamdown>
    </div>
  );
}
