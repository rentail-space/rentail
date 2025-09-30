import Header from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";

export default function TermsOfService() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h1 className="mb-8 text-4xl font-bold text-gray-900">
              Terms of Service
            </h1>

            <p className="mb-6 text-sm text-gray-600">
              Last Updated: {new Date().toLocaleDateString()}
            </p>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  1. Acceptance of Terms
                </h2>
                <p className="mb-4 text-gray-700">
                  By accessing and using rentail.space (the "Service"), you
                  accept and agree to be bound by the terms and provision of
                  this agreement. If you do not agree to these Terms of
                  Service, please do not use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  2. Description of Service
                </h2>
                <p className="mb-4 text-gray-700">
                  rentail.space is a platform that helps businesses find
                  short-term retail spaces in shopping centers. The Service
                  provides AI-powered assistance to discover, compare, and
                  connect with specialty leasing opportunities.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  3. User Accounts
                </h2>
                <p className="mb-4 text-gray-700">
                  To access certain features of the Service, you may be
                  required to create an account. You agree to:
                </p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>Provide accurate and complete registration information</li>
                  <li>
                    Maintain the security of your password and account
                  </li>
                  <li>
                    Notify us immediately of any unauthorized use of your
                    account
                  </li>
                  <li>
                    Accept responsibility for all activities under your account
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  4. Use of Service
                </h2>
                <p className="mb-4 text-gray-700">You agree not to:</p>
                <ul className="mb-4 ml-6 list-disc text-gray-700">
                  <li>
                    Use the Service for any illegal or unauthorized purpose
                  </li>
                  <li>
                    Violate any laws in your jurisdiction (including but not
                    limited to copyright laws)
                  </li>
                  <li>
                    Transmit any worms, viruses, or any code of a destructive
                    nature
                  </li>
                  <li>
                    Attempt to interfere with, compromise the system integrity
                    or security, or decipher any transmissions
                  </li>
                  <li>
                    Use automated systems to access the Service in a manner
                    that sends more request messages than a human can
                    reasonably produce
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  5. Intellectual Property
                </h2>
                <p className="mb-4 text-gray-700">
                  The Service and its original content, features, and
                  functionality are owned by rentail.space and are protected by
                  international copyright, trademark, patent, trade secret, and
                  other intellectual property or proprietary rights laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  6. AI-Generated Content
                </h2>
                <p className="mb-4 text-gray-700">
                  The Service uses artificial intelligence to provide
                  recommendations and information. While we strive for
                  accuracy, AI-generated content may contain errors or
                  inaccuracies. You should verify all information independently
                  before making business decisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  7. Third-Party Links
                </h2>
                <p className="mb-4 text-gray-700">
                  The Service may contain links to third-party websites or
                  services that are not owned or controlled by rentail.space.
                  We have no control over, and assume no responsibility for,
                  the content, privacy policies, or practices of any
                  third-party websites or services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  8. Disclaimer of Warranties
                </h2>
                <p className="mb-4 text-gray-700">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                  WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
                  BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR
                  A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  9. Limitation of Liability
                </h2>
                <p className="mb-4 text-gray-700">
                  IN NO EVENT SHALL RENTAIL.SPACE, ITS DIRECTORS, EMPLOYEES,
                  PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                  DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA,
                  USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM
                  YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE
                  SERVICE.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  10. Indemnification
                </h2>
                <p className="mb-4 text-gray-700">
                  You agree to defend, indemnify, and hold harmless
                  rentail.space and its licensee and licensors, and their
                  employees, contractors, agents, officers, and directors, from
                  and against any and all claims, damages, obligations, losses,
                  liabilities, costs or debt, and expenses arising from your
                  use of and access to the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  11. Termination
                </h2>
                <p className="mb-4 text-gray-700">
                  We may terminate or suspend your account and bar access to
                  the Service immediately, without prior notice or liability,
                  under our sole discretion, for any reason whatsoever and
                  without limitation, including but not limited to a breach of
                  the Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  12. Governing Law
                </h2>
                <p className="mb-4 text-gray-700">
                  These Terms shall be governed and construed in accordance
                  with the laws of the jurisdiction in which rentail.space
                  operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  13. Changes to Terms
                </h2>
                <p className="mb-4 text-gray-700">
                  We reserve the right, at our sole discretion, to modify or
                  replace these Terms at any time. If a revision is material,
                  we will provide at least 30 days' notice prior to any new
                  terms taking effect. What constitutes a material change will
                  be determined at our sole discretion.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  14. Contact Us
                </h2>
                <p className="mb-4 text-gray-700">
                  If you have any questions about these Terms, please contact
                  us at:
                </p>
                <p className="text-gray-700">
                  Email:{" "}
                  <a
                    href="mailto:legal@rentail.space"
                    className="text-indigo-600 hover:underline"
                  >
                    legal@rentail.space
                  </a>
                </p>
              </section>
            </div>

            <div className="mt-8 border-t pt-8">
              <p className="text-sm text-gray-600">
                By using rentail.space, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}