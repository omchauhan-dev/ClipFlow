import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { box: 'h-7 w-7', icon: 'h-3.5 w-3.5', text: 'text-sm' },
  md: { box: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-base' },
  lg: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-lg' },
};

export function BrandLogo({ href = '/', className, showText = true, size = 'md' }: BrandLogoProps) {
  const s = SIZES[size];
  const content = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className={cn('flex items-center justify-center rounded-lg bg-primary text-primary-foreground', s.box)}>
        <Sparkles className={s.icon} />
      </span>
      {showText && <span className={cn('font-semibold tracking-tight', s.text)}>Clipflow</span>}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}
