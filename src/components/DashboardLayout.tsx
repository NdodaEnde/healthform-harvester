// DashboardLayout.tsx - ONLY change this one line:

import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      {/* ONLY CHANGE: Remove max-w-7xl and adjust padding */}
      <div className="flex-1 pl-16 md:pl-64 pt-16 pb-12 pr-4 md:pr-8">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
