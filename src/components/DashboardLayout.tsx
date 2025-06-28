
import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 ml-16 md:ml-64 pt-16 pb-12 w-full">
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
