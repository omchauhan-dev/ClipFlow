import type { Metadata } from 'next';
import { LegalHeader, LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service · Clipflow',
  description: 'The terms that govern your use of Clipflow.',
};

export default function TermsPage() {
  return (
    <>
      <LegalHeader title="Terms of Service" />

      <p className="text-sm leading-relaxed text-muted-foreground mb-8">
        These Terms of Service ("Terms") govern your access to and use of Clipflow (the
        "Service"). By creating an account or using the Service, you agree to these Terms. If you
        do not agree, do not use the Service.
      </p>

      <LegalSection title="1. Eligibility & Accounts">
        <p>
          You must be at least 13 years old (or the minimum legal age in your jurisdiction) to use
          the Service. You are responsible for your account, for keeping your credentials secure,
          and for all activity under your account.
        </p>
      </LegalSection>

      <LegalSection title="2. The Service">
        <p>
          Clipflow provides AI-powered tools to generate videos, images, audio, and related
          content from your prompts and uploads. Output quality may vary and is not guaranteed.
        </p>
      </LegalSection>

      <LegalSection title="3. Your Content">
        <p>
          You retain ownership of the content you upload ("Input") and, to the extent permitted by
          law, the content you generate ("Output"). You grant us a limited license to process your
          Input and Output solely to operate and improve the Service. You are responsible for
          ensuring you have the rights to any Input you provide.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable Use">
        <p>You agree not to use the Service to create or distribute content that:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Infringes intellectual property or privacy rights.</li>
          <li>Is unlawful, defamatory, harassing, hateful, or violent.</li>
          <li>Is sexually explicit, exploits minors, or is otherwise abusive.</li>
          <li>Impersonates a real person without consent, or creates deceptive deepfakes.</li>
          <li>Contains malware, or attempts to disrupt or reverse-engineer the Service.</li>
        </ul>
        <p>We may suspend or terminate accounts that violate these rules.</p>
      </LegalSection>

      <LegalSection title="5. Credits & Subscriptions">
        <p>
          Certain features require credits or a paid subscription. Prices and plan details are
          shown on our Pricing page and may change with notice. Charges are billed through our
          payment provider. See our{' '}
          <a href="/legal/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</a>{' '}
          for details on refunds.
        </p>
      </LegalSection>

      <LegalSection title="6. Intellectual Property">
        <p>
          The Service, including its software, design, and branding, is owned by Clipflow and
          protected by law. These Terms do not grant you any rights to our trademarks or
          proprietary technology.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimers">
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind,
          whether express or implied, including fitness for a particular purpose and
          non-infringement. We do not warrant that the Service will be uninterrupted or error-free.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Clipflow shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or for any loss of profits or
          data, arising from your use of the Service. Our total liability is limited to the amount
          you paid us in the 12 months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection title="9. Indemnification">
        <p>
          You agree to indemnify and hold Clipflow harmless from any claims, damages, or expenses
          arising from your content or your violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate your access if
          you violate these Terms or to protect the Service and its users.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to These Terms">
        <p>
          We may update these Terms from time to time. Continued use of the Service after changes
          take effect constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact Us">
        <p>
          Questions about these Terms? Email us at{' '}
          <a href="mailto:support@clipflow.app" className="text-primary hover:underline">support@clipflow.app</a>.
        </p>
      </LegalSection>
    </>
  );
}
