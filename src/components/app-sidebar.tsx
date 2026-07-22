'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  Sparkles,
  Flame,
  FileVideo,
  Captions,
  Megaphone,
  PenSquare,
  Image as ImageIcon,
  Video,
  LayoutDashboard,
  FolderKanban,
  Users,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/studio', label: 'Studio', icon: Video },
  { href: '/viral-hooks', label: 'Viral Hooks', icon: Flame },
  { href: '/reel-scripts', label: 'Reel Scripts', icon: FileVideo },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/characters', label: 'Characters', icon: Users },
  { href: '/captions-hashtags', label: 'Captions & Hashtags', icon: Captions },
  { href: '/call-to-actions', label: 'Call to Actions', icon: Megaphone },
  { href: '/rewrite-tool', label: 'Rewrite Tool', icon: PenSquare },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar
        className={mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      >
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">ClipFlow</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </>
  )
}
