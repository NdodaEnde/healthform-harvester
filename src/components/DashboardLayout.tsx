
import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      {/* Add left margin to account for fixed sidebar width */}
      <div className="flex-1 ml-16 md:ml-64 pt-16 pb-12 px-4 md:px-8">
        <div className="w-full max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
