'use client';

import { useRouter } from 'next/navigation';
import { Plus, LogOut, User as UserIcon, CreditCard, Coins } from 'lucide-react';
import { signOut } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/brand-logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppHeaderProps {
  user?: { email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null;
  credits?: number | null;
  onNewProject?: () => void;
}

export function AppHeader({ user, credits, onNewProject }: AppHeaderProps) {
  const router = useRouter();
  const name = user?.user_metadata?.full_name || 'User';
  const initial = (name[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <BrandLogo href="/projects" size="sm" />

        <div className="flex items-center gap-3">
          {typeof credits === 'number' && (
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1.5 py-1 font-medium"
              onClick={() => router.push('/account')}
            >
              <Coins className="h-3.5 w-3.5 text-primary" />
              {credits} credits
            </Badge>
          )}

          {onNewProject && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onNewProject}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium transition-colors hover:bg-secondary/80">
                {initial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/account')} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing & plans
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
