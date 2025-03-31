
import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import HeaderComponent from "./HeaderComponent";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className={`flex-1 ${isMobile ? "ml-16" : "ml-16 md:ml-64"} transition-all duration-300`}>
        <HeaderComponent />
        <div className="py-16 px-4 md:px-6 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
