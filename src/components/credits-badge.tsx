'use client';
import { useRouter } from 'next/navigation';
import { useCredits, PLAN_LIMITS } from '@/hooks/use-credits';
import { Zap } from 'lucide-react';

export default function CreditsBadge() {
  const { credits, loading } = useCredits();
  const router = useRouter();

  if (loading || !credits) return null;

  const isUnlimited = PLAN_LIMITS[credits.plan] === Infinity;
  const remaining = credits.balance;
  const isLow = remaining === 0;
  const isWarning = remaining <= 1 && remaining > 0;

  return (
    <>
      <style>{`
        .cb-wrap {
          display: inline-flex; align-items: center; gap: 8px;
          background: #0f0f1a; border: 1px solid #1e1e2e; border-radius: 20px;
          padding: 5px 12px 5px 8px; cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .cb-wrap:hover { border-color: #7c3aed; }
        .cb-icon { color: #7c3aed; display: flex; align-items: center; }
        .cb-icon.low { color: #ef4444; }
        .cb-icon.warn { color: #f59e0b; }
        .cb-text { font-size: 12px; font-weight: 500; color: #9090a8; }
        .cb-count { font-size: 12px; font-weight: 700; color: #c4b5fd; }
        .cb-count.low { color: #f87171; }
        .cb-count.warn { color: #fbbf24; }
        .cb-plan {
          font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px;
          background: #1e1228; color: #a78bfa; letter-spacing: 0.05em; text-transform: uppercase;
        }
        .cb-plan.pro { background: #1a1200; color: #fbbf24; }
      `}</style>
      <div
        className="cb-wrap"
        onClick={() => router.push('/pricing')}
        title={`${remaining} credits remaining`}
      >
        <span className={`cb-icon ${isLow ? 'low' : isWarning ? 'warn' : ''}`}>
          <Zap size={13} fill="currentColor" />
        </span>
        <span className={`cb-count ${isLow ? 'low' : isWarning ? 'warn' : ''}`}>{remaining}</span>
        <span className="cb-text">credits</span>
        <span className={`cb-plan ${credits.plan === 'pro' ? 'pro' : ''}`}>{credits.plan}</span>
      </div>
    </>
  );
}
