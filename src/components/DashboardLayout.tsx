// DashboardLayout.tsx - DEFINITIVE FIX

import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      {/* 
        DEFINITIVE FIX: 
        1. Remove max-w-7xl (width constraint)
        2. Remove any container classes from children
        3. Use simple padding instead of px-6
        4. Content will now use full available width
      */}
      <div className="flex-1 ml-16 md:ml-64 pt-16 pb-12 px-4 md:px-8 w-full">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;