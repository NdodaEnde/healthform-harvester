
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
        The sidebar is fixed positioned with w-16 md:w-64, so we need to 
        add equivalent left margin to the content to avoid overlap
      */}
      <div className="flex-1 ml-16 md:ml-64 pt-16 pb-12 px-4 md:px-6 w-full max-w-none">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
