import type { Metadata } from 'next';
import { LegalHeader, LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy · Clipflow',
  description: 'How refunds, cancellations, and credits work at Clipflow.',
};

export default function RefundPage() {
  return (
    <>
      <LegalHeader title="Refund & Cancellation Policy" />

      <p className="text-sm leading-relaxed text-muted-foreground mb-8">
        This policy explains how subscriptions, credits, cancellations, and refunds work for the
        Clipflow Service. It should be read together with our{' '}
        <a href="/legal/terms" className="text-primary hover:underline">Terms of Service</a>.
      </p>

      <LegalSection title="1. Subscriptions">
        <p>
          Paid plans are billed in advance on a recurring basis (monthly or annually, as selected).
          Your subscription renews automatically until cancelled.
        </p>
      </LegalSection>

      <LegalSection title="2. Cancellation">
        <p>
          You can cancel your subscription at any time from your account settings. Cancellation
          stops future renewals; you retain access to paid features until the end of the current
          billing period. We do not provide partial refunds for unused time in a billing period
          unless required by law.
        </p>
      </LegalSection>

      <LegalSection title="3. Credits">
        <p>
          Credits used to generate content are consumed when a generation is requested. Because
          generation incurs real compute costs, consumed credits are non-refundable. Purchased
          credits do not expire unless stated otherwise at the time of purchase.
        </p>
      </LegalSection>

      <LegalSection title="4. Refunds">
        <p>We may grant refunds at our discretion in cases such as:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Duplicate or accidental charges.</li>
          <li>A confirmed billing error on our side.</li>
          <li>Service failures that prevented you from using credits you paid for.</li>
        </ul>
        <p>
          Refund requests should be made within 7 days of the charge by contacting support.
          Approved refunds are issued to the original payment method and may take several business
          days to appear.
        </p>
      </LegalSection>

      <LegalSection title="5. Failed Generations">
        <p>
          If a generation fails due to a system error on our side, the associated credits will be
          restored to your account. Failures caused by invalid input or policy violations may not
          be eligible for credit restoration.
        </p>
      </LegalSection>

      <LegalSection title="6. Price Changes">
        <p>
          We may change plan prices with prior notice. Changes take effect at your next billing
          cycle. Continuing your subscription after a price change constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact Us">
        <p>
          For billing questions or refund requests, email{' '}
          <a href="mailto:support@clipflow.app" className="text-primary hover:underline">support@clipflow.app</a>{' '}
          with your account email and the transaction details.
        </p>
      </LegalSection>
    </>
  );
}
