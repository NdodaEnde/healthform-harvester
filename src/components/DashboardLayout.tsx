
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
        "pt-16 pb-12 px-6 lg:px-8", // Better responsive padding with more space on larger screens
        "max-w-full overflow-x-auto", // Prevent horizontal overflow
        className
      )}>
        <div className="max-w-none w-full"> {/* Changed from max-w-7xl to max-w-none and added w-full */}
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
