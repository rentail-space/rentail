import { Streamdown } from "streamdown";

const terms = `
# Terms of Service

Last Updated: 10/02/2025

## 1. Acceptance of Terms

By accessing and using rentail.space (the "Service"), you accept and agree to be
bound by the terms and provision of this agreement. If you do not agree to these
Terms of Service, please do not use the Service.

## 2. Description of Service

rentail.space is a platform that helps businesses find short-term retail spaces
in shopping centers. The Service provides AI-powered assistance to discover,
compare, and connect with specialty leasing opportunities.

## 3. User Accounts

To access certain features of the Service, you may be required to create an
account. You agree to:

- Provide accurate and complete registration information
- Maintain the security of your password and account
- Notify us immediately of any unauthorized use of your account
- Accept responsibility for all activities under your account

## 4. Use of Service

You agree not to:

- Use the Service for any illegal or unauthorized purpose
- Violate any laws in your jurisdiction (including but not limited to copyright laws)
- Transmit any worms, viruses, or any code of a destructive nature
- Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions
- Use automated systems to access the Service in a manner that sends more request messages than a human can reasonably produce

## 5. Intellectual Property

The Service and its original content, features, and functionality are owned by
rentail.space and are protected by international copyright, trademark, patent,
trade secret, and other intellectual property or proprietary rights laws.

## 6. AI-Generated Content

The Service uses artificial intelligence to provide recommendations and
information. While we strive for accuracy, AI-generated content may contain
errors or inaccuracies. You should verify all information independently before
making business decisions.

## 7. Third-Party Links

The Service may contain links to third-party websites or services that are not
owned or controlled by rentail.space. We have no control over, and assume no
responsibility for, the content, privacy policies, or practices of any
third-party websites or services.

## 8. Disclaimer of Warranties

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

## 9. Limitation of Liability

IN NO EVENT SHALL RENTAIL.SPACE, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS,
SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF
PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR
ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.

## 10. Indemnification

You agree to defend, indemnify, and hold harmless rentail.space and its licensee
and licensors, and their employees, contractors, agents, officers, and
directors, from and against any and all claims, damages, obligations, losses,
liabilities, costs or debt, and expenses arising from your use of and access to
the Service.

## 11. Termination

We may terminate or suspend your account and bar access to the Service
immediately, without prior notice or liability, under our sole discretion, for
any reason whatsoever and without limitation, including but not limited to a
breach of the Terms.

## 12. Governing Law

These Terms shall be governed and construed in accordance with the laws of the
jurisdiction in which rentail.space operates, without regard to its conflict of
law provisions.

## 13. Changes to Terms

We reserve the right, at our sole discretion, to modify or replace these Terms
at any time. If a revision is material, we will provide at least 30 days' notice
prior to any new terms taking effect. What constitutes a material change will be
determined at our sole discretion.

## 14. Contact Us

If you have any questions about these Terms, please contact us at:

Email: [legal@rentail.space](mailto:legal@rentail.space)

By using rentail.space, you acknowledge that you have read, understood, and
agree to be bound by these Terms of Service.
`;

export default function TermsOfService() {
  return (
    <div className="min-h-screen  py-12 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 prose">
      <Streamdown>{terms}</Streamdown>
    </div>
  );
}
