import type { PropsWithChildren } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function ToolsLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="flex justify-center w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="w-full max-w-3xl">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
