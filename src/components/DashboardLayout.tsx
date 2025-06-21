
import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className={cn(
        "flex-1 transition-all duration-300",
        "ml-16 md:ml-64", // Responsive margin based on sidebar width
        "pt-16 pb-12 px-4 sm:px-6", // Responsive padding
        "max-w-full overflow-x-auto", // Prevent horizontal overflow
        className
      )}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
