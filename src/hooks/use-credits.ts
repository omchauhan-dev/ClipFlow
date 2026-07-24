import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type Plan = 'free' | 'starter' | 'pro';

export interface Credits {
  plan: Plan;
  balance: number;
}

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 50,
  starter: 200,
  pro: Infinity,
};

export function useCredits() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    try {
      const res = await fetch('/api/credits', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setCredits({ plan: data.plan ?? 'free', balance: data.balance ?? 0 });
    } catch {
      /* silent */
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  return { credits, loading, refetch: fetchCredits };
}
