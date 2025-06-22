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
        CRITICAL FIX: Remove px-4 md:px-8 padding completely!
        This padding was creating the gap you see in the image.
        Now content will start right at the sidebar edge.
      */}
      <div className="flex-1 ml-16 md:ml-64 pt-16 pb-12 w-full">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
