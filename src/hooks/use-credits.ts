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
  starter: 500,
  pro: Infinity,
};

export function useCredits() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchCredits() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('profiles')
      .select('credits_balance, plan')
      .eq('id', user.id)
      .single();

    if (error || !data) { setLoading(false); return; }

    const plan = (data.plan || 'free') as Plan;
    const balance = data.credits_balance ?? 10;

    setCredits({
      plan,
      balance,
      can_generate: balance > 0,
    });
    setLoading(false);
  }

  useEffect(() => { fetchCredits(); }, []);

  return { credits, loading, refetch: fetchCredits };
}
