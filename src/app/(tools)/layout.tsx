import type { PropsWithChildren } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AuthGuard from '@/components/auth-guard';

export default function ToolsLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AuthGuard>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:flex focus:h-12 focus:items-center focus:rounded-md focus:border-2 focus:bg-background focus:px-4 focus:text-sm focus:font-bold focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
              <div className="font-bold">Clipflow</div>
            </header>
            <div className="flex justify-center w-full px-4 sm:px-6 lg:px-8 py-8">
              <div className="w-full max-w-3xl">
                {children}
              </div>
            </div>
          </SidebarInset>
        </div>
      </AuthGuard>
    </SidebarProvider>
  );
}
