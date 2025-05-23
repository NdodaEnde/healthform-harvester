
import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 ml-16 md:ml-64 pt-16 pb-12 px-6 max-w-7xl">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
