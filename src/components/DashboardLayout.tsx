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
        CORRECT FIX: Keep the flex layout but fix the spacing issue.
        The problem was max-w-7xl constraining width and creating gap.
        We keep ml-16 md:ml-64 because that's the correct spacing for the fixed sidebar.
      */}
      <div className="flex-1 ml-16 md:ml-64 pt-16 pb-12 px-4 md:px-6">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;