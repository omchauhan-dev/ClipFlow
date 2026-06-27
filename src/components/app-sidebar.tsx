'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Sparkles,
<<<<<<< Updated upstream
} from 'lucide-react';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    href: '/viral-hooks',
    label: 'Viral Hooks',
    icon: Flame,
  },
  {
    href: '/reel-scripts',
    label: 'Reel Scripts',
    icon: FileVideo,
  },
  {
    href: '/captions-hashtags',
    label: 'Captions & Hashtags',
    icon: Captions,
  },
  {
    href: '/call-to-actions',
    label: 'Call to Actions',
    icon: Megaphone,
  },
  {
    href: '/rewrite-tool',
    label: 'Rewrite Tool',
    icon: PenSquare,
  },
=======
  User,
  Gift,
  LifeBuoy,
  Settings,
  LogOut,
  FolderKanban,
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  AudioLines,
  Users,
  PanelLeft,
} from 'lucide-react';

const quickActions = [
  { label: 'Profile', icon: User, href: '/account' },
  { label: 'Credits', icon: Gift, href: '/pricing' },
  { label: 'Support', icon: LifeBuoy, href: '/support' },
];

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Projects', icon: FolderKanban, href: '/projects' },
  {
    label: 'Gallery',
    icon: ImageIcon,
    children: [
      { label: 'Images', href: '/gallery/images' },
      { label: 'Videos', href: '/gallery/videos' },
      { label: 'Audio', href: '/gallery/audio' },
    ],
  },
  { label: 'Studio', icon: Video, href: '/studio' },
  { label: 'Characters', icon: Users, href: '/characters' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Log out', icon: LogOut, href: '/logout', danger: true },
>>>>>>> Stashed changes
];

export function AppSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Gallery: true,
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href;
  const isActiveParent = (item: NavItem) =>
    item.children?.some((c) => isActive(c.href)) || (item.href && isActive(item.href));

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
<<<<<<< Updated upstream
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <SidebarTrigger>
              <Sparkles />
            </SidebarTrigger>
          </Button>
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
             <Sparkles className="text-primary h-6 w-6" />
            <h1 className="text-lg font-bold font-headline">ReelGenius</h1>
          </div>
=======
    <>
      {/* Mobile toggle */}
      <button
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-md border-2 md:hidden"
        style={{
          borderColor: 'var(--brut-border)',
          backgroundColor: 'var(--brut-bg)',
          boxShadow: 'var(--brut-shadow-xs)',
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
      >
        <PanelLeft className="h-5 w-5" style={{ color: 'var(--brut-text-heading)' }} />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 flex h-full flex-col border-r-2 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
        style={{
          width: '256px',
          backgroundColor: 'var(--brut-bg)',
          borderColor: 'var(--brut-border)',
        }}
        aria-label="Main navigation sidebar"
      >
      {/* User identity header */}
      <h2 className="sr-only">Account</h2>
      <div className="flex items-center gap-3 px-3 pt-4 pb-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center border-2"
          style={{
            borderRadius: 'var(--brut-radius-full)',
            borderColor: 'var(--brut-border)',
            backgroundColor: 'var(--brut-bg-secondary)',
          }}
        >
          <User className="h-4 w-4" style={{ color: 'var(--brut-text-heading)' }} />
>>>>>>> Stashed changes
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className="truncate text-sm font-bold leading-tight"
            style={{ color: 'var(--brut-text-heading)' }}
          >
            Alex Morgan
          </span>
          <span
            className="truncate text-xs leading-tight"
            style={{ color: 'var(--brut-text-muted)' }}
          >
            alex@clipflow.ai
          </span>
        </div>
        <button
          className="flex h-6 w-6 items-center justify-center rounded"
          aria-label="Switch account"
          style={{ color: 'var(--brut-text-muted)' }}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Quick-action buttons row */}
      <div
        className="border-y-2 px-3 py-4"
        style={{
          borderColor: 'var(--brut-border)',
          backgroundColor: 'var(--brut-bg)',
        }}
      >
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-1 flex-col items-center gap-1 rounded-md border-2 px-2 py-2 text-center transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--brut-border)',
                borderRadius: 'var(--brut-radius-base)',
                backgroundColor: 'var(--brut-bg)',
                boxShadow: 'var(--brut-shadow-xs)',
              }}
            >
              <action.icon
                className="h-4 w-4"
                style={{ color: 'var(--brut-text-heading)' }}
              />
              <span
                className="text-[11px] font-bold leading-tight"
                style={{ color: 'var(--brut-text-heading)' }}
              >
                {action.label}
              </span>
            </Link>
          ))}
<<<<<<< Updated upstream
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
=======
        </div>
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
        <ul className="flex flex-col gap-1" style={{ gap: '8px' }}>
          {navItems.map((item) => {
            const active = isActiveParent(item);
            const expanded = openSections[item.label];
            const Icon = item.icon;

            if (item.children) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() => toggleSection(item.label)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-bold transition-colors"
                    style={{
                      borderRadius: 'var(--brut-radius-base)',
                      color: active ? 'var(--brut-fg-brand-strong)' : 'var(--brut-text-heading)',
                      backgroundColor: active ? 'var(--brut-bg-brand-soft)' : 'transparent',
                      borderLeft: active ? '3px solid var(--brut-brand)' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--brut-bg-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    aria-expanded={expanded}
                  >
                    <Icon
                      className="h-5 w-5 shrink-0"
                      style={{
                        color: active ? 'var(--brut-text-heading)' : 'var(--brut-text-body)',
                      }}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className="h-4 w-4 transition-transform"
                      style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--brut-text-muted)',
                      }}
                    />
                  </button>
                  {expanded && (
                    <ul className="mt-1 flex flex-col gap-0.5 pl-4">
                      {item.children.map((child) => (
                        <li key={child.href}>
              <Link
                          href={child.href}
                          className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors"
                          style={{
                            paddingLeft: '44px',
                            borderRadius: 'var(--brut-radius-base)',
                            color: isActive(child.href)
                              ? 'var(--brut-fg-brand-strong)'
                              : 'var(--brut-text-body)',
                            fontWeight: isActive(child.href) ? '700' : '500',
                            backgroundColor: isActive(child.href)
                              ? 'var(--brut-bg-brand-soft)'
                              : 'transparent',
                          }}
                          aria-current={isActive(child.href) ? 'page' : undefined}
                          onMouseEnter={(e) => {
                            if (!isActive(child.href)) {
                              e.currentTarget.style.backgroundColor = 'var(--brut-bg-hover)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive(child.href)) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {child.label}
                        </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href!}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-bold transition-colors"
                  style={{
                    borderRadius: 'var(--brut-radius-base)',
                    color: active ? 'var(--brut-fg-brand-strong)' : 'var(--brut-text-heading)',
                    backgroundColor: active ? 'var(--brut-bg-brand-soft)' : 'transparent',
                    borderLeft: active ? '3px solid var(--brut-brand)' : '3px solid transparent',
                  }}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'var(--brut-bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    style={{
                      color: active ? 'var(--brut-text-heading)' : 'var(--brut-text-body)',
                    }}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom utility group */}
      <div className="mt-auto border-t-2 px-3 py-3" style={{ borderColor: 'var(--brut-border)' }}>
        <ul className="flex flex-col gap-1">
          {bottomItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-bold transition-colors"
                style={{
                  borderRadius: 'var(--brut-radius-base)',
                  color: item.danger ? 'var(--brut-danger)' : 'var(--brut-text-heading)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--brut-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <item.icon
                  className="h-5 w-5 shrink-0"
                  style={{
                    color: item.danger ? 'var(--brut-danger)' : 'var(--brut-text-body)',
                  }}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
    </>
>>>>>>> Stashed changes
  );
}
