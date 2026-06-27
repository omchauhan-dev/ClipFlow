'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, Zap, Sparkles, Crown, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: typeof Sparkles;
  features: string[];
  cta: string;
  planKey?: 'starter' | 'pro';
  highlight?: boolean;
  disabled?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '₹0',
    period: '/mo',
    description: 'Try it out',
    icon: Sparkles,
    features: ['10 free generations', 'AI images & video', 'English, Hinglish & Hindi', 'Standard quality'],
    cta: 'Current plan',
    disabled: true,
  },
  {
    name: 'Starter',
    price: '₹1,900',
    period: '/mo',
    description: 'For growing creators',
    icon: Zap,
    features: [
      '50 generations / month',
      'All AI models',
      'All languages incl. Hindi',
      'HD voiceover',
      'Talking avatars',
      'Project history',
    ],
    cta: 'Get Starter',
    planKey: 'starter',
  },
  {
    name: 'Pro',
    price: '₹3,900',
    period: '/mo',
    description: 'For power creators & teams',
    icon: Crown,
    features: [
      'Unlimited generations',
      'All AI models',
      'Priority GPU queue',
      'Premium voiceover',
      'Full project history',
      'Priority support',
      'Early access to new tools',
    ],
    cta: 'Get Pro',
    planKey: 'pro',
    highlight: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const id = 'razorpay-checkout-js';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  async function handleUpgrade(plan: Plan) {
    if (plan.disabled || !plan.planKey) return;
    if (typeof (window as unknown as { Razorpay?: unknown }).Razorpay === 'undefined') {
      alert('Payment library still loading, please try again in a moment.');
      return;
    }
    setLoadingPlan(plan.planKey);
    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.planKey }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        alert(order.error || 'Could not start checkout');
        setLoadingPlan(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const RazorpayCtor = (window as unknown as { Razorpay: new (o: unknown) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayCtor({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Clipflow',
        description: order.label,
        order_id: order.order_id,
        prefill: {
          name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
        },
        theme: { color: '#7c3aed' },
        handler: async function (response: Record<string, string>) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.planKey,
              user_id: user?.id,
            }),
          });
          const verify = await verifyRes.json();
          if (verify.verified) {
            alert(`Payment successful! You're now on the ${plan.name} plan.`);
            router.push('/projects');
          } else {
            alert('Payment could not be verified. If you were charged, contact support.');
          }
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      });
      rzp.open();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-8 gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Pricing</p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">Simple, creator-friendly pricing</h1>
          <p className="text-muted-foreground">Start free. Upgrade when you&apos;re ready to scale.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={cn(
                  'relative flex flex-col p-6 transition-colors',
                  plan.highlight
                    ? 'border-primary/60 bg-gradient-to-b from-primary/5 to-transparent shadow-lg shadow-primary/10'
                    : 'hover:border-border'
                )}
              >
                {plan.highlight && (
                  <Badge className="absolute right-4 top-4 gap-1">
                    <Crown className="h-3 w-3" /> Popular
                  </Badge>
                )}

                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>

                <div className="mb-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlight ? 'default' : plan.disabled ? 'secondary' : 'outline'}
                  disabled={plan.disabled || loadingPlan === plan.planKey}
                  onClick={() => handleUpgrade(plan)}
                  className="w-full gap-2"
                >
                  {loadingPlan === plan.planKey && <Loader2 className="h-4 w-4 animate-spin" />}
                  {plan.cta}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 text-center text-sm text-muted-foreground">
          <p>All plans include a 7-day money-back guarantee.</p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            🔒 Secure payments via Razorpay · Prices in INR
          </p>
        </div>
      </div>
    </div>
  );
}
