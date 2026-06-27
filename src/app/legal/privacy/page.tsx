import type { Metadata } from 'next';
import { LegalHeader, LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy · Clipflow',
  description: 'How Clipflow collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <LegalHeader title="Privacy Policy" />

      <p className="text-sm leading-relaxed text-muted-foreground mb-8">
        This Privacy Policy explains how Clipflow ("Clipflow", "we", "us", or "our") collects,
        uses, and shares information about you when you use our website and services
        (the "Service"). By using the Service, you agree to the practices described here.
      </p>

      <LegalSection title="1. Information We Collect">
        <p>We collect the following categories of information:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Account information:</strong> when you sign in with Google, we receive your name, email address, and profile image.</li>
          <li><strong>Content you create:</strong> prompts, uploaded images, generated videos and images, and related project data.</li>
          <li><strong>Usage data:</strong> log data, device and browser information, and how you interact with the Service.</li>
          <li><strong>Payment information:</strong> processed by our third-party payment provider; we do not store full card details.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To provide, operate, and improve the Service.</li>
          <li>To generate the videos, images, and audio you request.</li>
          <li>To manage your account, credits, and subscriptions.</li>
          <li>To communicate with you about updates, security, and support.</li>
          <li>To detect, prevent, and address fraud, abuse, and security issues.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. AI Processing">
        <p>
          Prompts and uploaded media are processed by AI models, which may run on our
          infrastructure or trusted third-party compute providers, solely to generate your
          requested output. We do not use your private content to train foundation models
          without your consent.
        </p>
      </LegalSection>

      <LegalSection title="4. How We Share Information">
        <p>We do not sell your personal information. We share data only with:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Service providers</strong> (e.g., authentication, hosting, GPU compute, storage, payments) acting on our behalf.</li>
          <li><strong>Legal authorities</strong> when required by law or to protect rights and safety.</li>
          <li><strong>In a business transfer</strong> such as a merger or acquisition.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Data Retention">
        <p>
          We retain your account and content data for as long as your account is active or as
          needed to provide the Service. You may delete projects at any time, and you can request
          full account deletion by contacting us.
        </p>
      </LegalSection>

      <LegalSection title="6. Security">
        <p>
          We use industry-standard measures to protect your data. However, no method of
          transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights">
        <p>
          Depending on your location, you may have rights to access, correct, export, or delete
          your personal data, and to object to or restrict certain processing. To exercise these
          rights, contact us using the details below.
        </p>
      </LegalSection>

      <LegalSection title="8. Children's Privacy">
        <p>
          The Service is not directed to individuals under 13 (or the minimum age in your
          jurisdiction), and we do not knowingly collect their personal information.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be posted on
          this page with an updated "Last updated" date.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact Us">
        <p>
          Questions about this policy? Email us at{' '}
          <a href="mailto:support@clipflow.app" className="text-primary hover:underline">support@clipflow.app</a>.
        </p>
      </LegalSection>
    </>
  );
}
