
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Home,
  Users,
  LogOut,
  Menu,
  X,
  Building2,
  CalendarDays,
  FilePlus,
  FileText,
  Settings,
  User,
  LayoutTemplate,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';

// Add this type at the top of the file
type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const DashboardSidebar = () => {
  const { pathname } = useLocation();
  const { isMobile } = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { currentOrganization, isServiceProvider } = useOrganization();

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: 'Patients',
      href: '/patients',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Upload',
      href: '/upload',
      icon: <FilePlus className="h-5 w-5" />,
    },
    {
      title: 'Templates',
      href: '/templates',
      icon: <LayoutTemplate className="h-5 w-5" />,
    },
    {
      title: 'Calendar',
      href: '/calendar',
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      title: 'Organizations',
      href: '/organizations',
      icon: <Building2 className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isServiceProvider());

  return (
    <>
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
          isMobile ? (isOpen ? "block" : "hidden") : "hidden"
        )}
        onClick={closeSidebar}
      />

      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-background shadow-lg transition-transform",
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <span className="text-xl font-bold">Health Portal</span>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {currentOrganization && (
          <div className="px-4 py-2">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{currentOrganization.name}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-auto p-4">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <ul className="space-y-2">
            <li>
              <Link
                to="/logout"
                onClick={closeSidebar}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default DashboardSidebar;
