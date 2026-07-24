import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type Plan = 'free' | 'starter' | 'pro';

export interface Credits {
  plan: Plan;
  balance: number;
  can_generate: boolean;
}

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 10,
  starter: 50,
  pro: Infinity,
};

export function useCredits() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchCredits() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    // Use API route (service role) instead of direct client (anon key may hit RLS)
    try {
      const res = await fetch('/api/credits', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { balance = 0 } = await res.json();

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();

      const plan = (profile?.plan || 'free') as Plan;
      setCredits({ plan, balance, can_generate: balance > 0 });
    } catch {
      /* silent */
    }
    setLoading(false);
  }

  useEffect(() => { fetchCredits(); }, []);

  return { credits, loading, refetch: fetchCredits };
}
