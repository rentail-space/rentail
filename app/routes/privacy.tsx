import Header from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h1 className="mb-8 text-4xl font-bold text-gray-900">
              Privacy Policy
            </h1>

            <p className="mb-6 text-sm text-gray-600">
              Last Updated: {new Date().toLocaleDateString()}
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  1. Introduction
                </h2>
                <p className="mb-4 text-gray-700">
                  rentail.space ("we," "our," or "us") is committed to
                  protecting your privacy. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when
                  you use our service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  2. Information We Collect
                </h2>
                <h3 className="mb-3 text-xl font-medium text-gray-800">
                  Personal Information
                </h3>
                <p className="mb-4 text-gray-700">
                  We collect information that you provide directly to us,
                  including:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>Name and email address (when you create an account)</li>
                  <li>Password (encrypted and securely stored)</li>
                  <li>Communication preferences</li>
                  <li>
                    Any information you provide when using our chat service
                  </li>
                </ul>

                <h3 className="mb-3 text-xl font-medium text-gray-800">
                  Automatically Collected Information
                </h3>
                <p className="mb-4 text-gray-700">
                  When you access our service, we automatically collect:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>IP address and geolocation data</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Usage data and interaction patterns</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  3. How We Use Your Information
                </h2>
                <p className="mb-4 text-gray-700">
                  We use the information we collect to:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>Provide, maintain, and improve our services</li>
                  <li>
                    Personalize your experience and provide AI-powered
                    recommendations
                  </li>
                  <li>Process your requests and respond to your inquiries</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, prevent, and address technical issues</li>
                  <li>Comply with legal obligations and protect our rights</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  4. AI and Data Processing
                </h2>
                <p className="mb-4 text-gray-700">
                  Our service uses artificial intelligence (Claude AI by
                  Anthropic) to provide personalized recommendations. Your chat
                  conversations may be processed by our AI systems to:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>
                    Understand your retail space requirements and preferences
                  </li>
                  <li>Provide relevant property recommendations</li>
                  <li>Improve the quality of our AI responses</li>
                  <li>Maintain conversation context and history</li>
                </ul>
                <p className="mb-4 text-gray-700">
                  We store chat histories to improve your experience across
                  sessions. You can request deletion of your chat history at any
                  time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  5. Information Sharing and Disclosure
                </h2>
                <p className="mb-4 text-gray-700">
                  We do not sell your personal information. We may share your
                  information in the following circumstances:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>
                    <strong>Service Providers:</strong> With third-party vendors
                    who perform services on our behalf (e.g., hosting,
                    analytics, AI processing)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or
                    to protect our rights
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In connection with a
                    merger, acquisition, or sale of assets
                  </li>
                  <li>
                    <strong>With Your Consent:</strong> When you explicitly
                    authorize us to share your information
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  6. Data Security
                </h2>
                <p className="mb-4 text-gray-700">
                  We implement appropriate technical and organizational measures
                  to protect your personal information, including:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure password hashing using industry standards</li>
                  <li>Regular security assessments and monitoring</li>
                  <li>Access controls and authentication requirements</li>
                  <li>
                    Error tracking and performance monitoring (via Sentry)
                  </li>
                </ul>
                <p className="mb-4 text-gray-700">
                  However, no method of transmission over the Internet or
                  electronic storage is 100% secure, and we cannot guarantee
                  absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  7. Cookies and Tracking Technologies
                </h2>
                <p className="mb-4 text-gray-700">
                  We use cookies and similar tracking technologies to:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>Maintain your session and authentication state</li>
                  <li>Remember your preferences</li>
                  <li>Analyze usage patterns and improve our service</li>
                  <li>Track performance metrics (via Vercel Speed Insights)</li>
                </ul>
                <p className="mb-4 text-gray-700">
                  You can control cookies through your browser settings, but
                  disabling cookies may affect your ability to use certain
                  features.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  8. Your Rights and Choices
                </h2>
                <p className="mb-4 text-gray-700">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>
                    <strong>Access:</strong> Request access to your personal
                    information
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of
                    inaccurate data
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal
                    information
                  </li>
                  <li>
                    <strong>Data Portability:</strong> Request a copy of your
                    data in a structured format
                  </li>
                  <li>
                    <strong>Opt-out:</strong> Unsubscribe from marketing
                    communications
                  </li>
                  <li>
                    <strong>Object:</strong> Object to certain processing of
                    your data
                  </li>
                </ul>
                <p className="mb-4 text-gray-700">
                  To exercise these rights, please contact us at{" "}
                  <a
                    href="mailto:privacy@rentail.space"
                    className="text-indigo-600 hover:underline"
                  >
                    privacy@rentail.space
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  9. Data Retention
                </h2>
                <p className="mb-4 text-gray-700">
                  We retain your personal information for as long as necessary
                  to provide our services and fulfill the purposes outlined in
                  this Privacy Policy. When you delete your account, we will
                  delete or anonymize your personal information, except where we
                  are required to retain it for legal purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  10. Children's Privacy
                </h2>
                <p className="mb-4 text-gray-700">
                  Our service is not intended for children under 13 years of
                  age. We do not knowingly collect personal information from
                  children under 13. If you believe we have collected
                  information from a child under 13, please contact us
                  immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  11. International Data Transfers
                </h2>
                <p className="mb-4 text-gray-700">
                  Your information may be transferred to and processed in
                  countries other than your country of residence. These
                  countries may have data protection laws that differ from those
                  of your country. We take steps to ensure that your information
                  receives an adequate level of protection.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  12. Changes to This Privacy Policy
                </h2>
                <p className="mb-4 text-gray-700">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any material changes by posting the new Privacy
                  Policy on this page and updating the "Last Updated" date. You
                  are advised to review this Privacy Policy periodically for any
                  changes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  13. Contact Us
                </h2>
                <p className="mb-4 text-gray-700">
                  If you have any questions about this Privacy Policy, please
                  contact us at:
                </p>
                <p className="mb-2 text-gray-700">
                  Email:{" "}
                  <a
                    href="mailto:privacy@rentail.space"
                    className="text-indigo-600 hover:underline"
                  >
                    privacy@rentail.space
                  </a>
                </p>
              </section>
            </div>

            <div className="mt-8 border-t pt-8">
              <p className="text-sm text-gray-600">
                By using rentail.space, you acknowledge that you have read,
                understood, and agree to this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
