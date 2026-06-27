'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Loader2, Crown, Zap, Sparkles, Coins, ArrowUpRight, Check, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';

type Plan = 'free' | 'starter' | 'pro';

interface CreditsRow {
  plan: Plan;
  balance: number;
}

const PLAN_META: Record<Plan, { name: string; icon: typeof Sparkles; monthly: number | null }> = {
  free: { name: 'Free', icon: Sparkles, monthly: 10 },
  starter: { name: 'Starter', icon: Zap, monthly: 50 },
  pro: { name: 'Pro', icon: Crown, monthly: null },
};

const CREDIT_PACKS = [
  { id: 'pack_5', credits: 5, price: '₹400' },
  { id: 'pack_15', credits: 15, price: '₹1,100', popular: true },
  { id: 'pack_50', credits: 50, price: '₹3,500' },
];

interface SessionUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [credits, setCredits] = useState<CreditsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  const fetchCredits = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('plan, credits_balance').eq('id', userId).single();
    setCredits(data ? { plan: data.plan || 'free', balance: data.credits_balance ?? 0 } : { plan: 'free', balance: 0 });
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      setUser(session.user as SessionUser);
      fetchCredits(session.user.id);
    });
  }, [router, fetchCredits]);

  useEffect(() => {
    const id = 'razorpay-checkout-js';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  async function buyPack(packId: string) {
    if (typeof (window as unknown as { Razorpay?: unknown }).Razorpay === 'undefined') {
      alert('Payment library still loading, try again in a moment.');
      return;
    }
    setBuyingPack(packId);
    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: packId, user_id: user?.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        alert(order.error || 'Could not start checkout');
        setBuyingPack(null);
        return;
      }
      const RazorpayCtor = (window as unknown as { Razorpay: new (o: unknown) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayCtor({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Clipflow',
        description: order.label,
        order_id: order.order_id,
        prefill: { name: user?.user_metadata?.full_name || '', email: user?.email || '' },
        theme: { color: '#7c3aed' },
        handler: async function (response: Record<string, string>) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              pack: packId,
              user_id: user?.id,
            }),
          });
          const verify = await verifyRes.json();
          if (verify.verified) {
            setBuyOpen(false);
            if (user) fetchCredits(user.id);
          } else {
            alert('Payment could not be verified. If you were charged, contact support.');
          }
        },
        modal: { ondismiss: () => setBuyingPack(null) },
      });
      rzp.open();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setBuyingPack(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const plan = credits?.plan || 'free';
  const meta = PLAN_META[plan];
  const PlanIcon = meta.icon;
  const balance = credits?.balance ?? 0;
  const monthly = meta.monthly;
  const usedPct = monthly ? Math.min(100, Math.max(0, ((monthly - balance) / monthly) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/projects')}
          className="mb-6 gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>

        <h1 className="mb-1 text-2xl font-bold tracking-tight">Account</h1>
        <p className="mb-8 text-sm text-muted-foreground">Manage your plan and credits.</p>

        {/* Profile */}
        <Card className="mb-5 flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-medium">
            {(user?.user_metadata?.full_name?.[0] || 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium">{user?.user_metadata?.full_name || 'User'}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </Card>

        {/* Plan + credits */}
        <Card className="mb-5 p-6">
          <div className="mb-5 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <PlanIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{meta.name} Plan</h2>
                  {plan === 'free' && <Badge variant="secondary">Current</Badge>}
                  {plan !== 'free' && <Badge className="gap-1"><Check className="h-3 w-3" />Active</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan === 'pro' ? 'Unlimited generations' : `${monthly} monthly credits`}
                </p>
              </div>
            </div>
            {plan !== 'pro' && (
              <Button size="sm" className="gap-1.5" onClick={() => router.push('/pricing')}>
                Upgrade
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Coins className="h-4 w-4 text-primary" />
                Credits remaining
              </span>
              <span className="font-medium">
                {balance}{monthly ? ` / ${monthly}` : ''}
              </span>
            </div>
            {monthly ? (
              <Progress value={100 - usedPct} className="h-2" />
            ) : (
              <p className="text-xs text-muted-foreground">Pro plan — generate without limits.</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full gap-1.5"
              onClick={() => setBuyOpen(true)}
            >
              <Coins className="h-3.5 w-3.5" />
              Buy credits
            </Button>
          </div>
        </Card>

        {/* What a credit buys */}
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-semibold">How credits work</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 image ≈ 1 credit</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 video clip ≈ 2 credits</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 talking avatar ≈ 3 credits</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Credits never expire</li>
          </ul>
        </Card>
      </main>

      {/* Buy credits modal */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buy credits</DialogTitle>
            <DialogDescription>Top up your balance. Credits never expire.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.id}
                disabled={buyingPack === pack.id}
                onClick={() => buyPack(pack.id)}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-4 text-left transition-colors',
                  pack.popular ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-border/80 hover:bg-secondary/40'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      {pack.credits} credits
                      {pack.popular && <Badge className="text-[10px]">Best value</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{pack.price}</p>
                  </div>
                </div>
                {buyingPack === pack.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-sm font-medium text-primary">{pack.price}</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
