
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalOrganization } from '@/contexts/OrganizationContext';
import UserMenu from '@/components/UserMenu';
import { User, Menu } from 'lucide-react';
import { Button } from './ui/button';
import OrganizationLogo from './OrganizationLogo';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { DashboardSidebar } from './DashboardSidebar';
import OrganizationSwitcher from './OrganizationSwitcher';
import ThemeToggle from './ThemeToggle';

const HeaderComponent: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const orgContext = useOptionalOrganization();

  // Public routes that don't need organization context
  const isPublicPath = 
    location.pathname === '/' || 
    location.pathname === '/auth' || 
    location.pathname === '/reset-password' ||
    location.pathname === '/update-password' ||
    location.pathname === '/accept-invite' ||
    location.pathname.startsWith('/auth/callback') ||
    location.pathname.startsWith('/callback');

  // On public routes, we don't need the organization context at all
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            {orgContext?.currentOrganization && !isPublicPath ? (
              <OrganizationLogo 
                organization={orgContext.currentClient || orgContext.currentOrganization} 
                size="sm" 
                fallbackText="SurgiScan"
              />
            ) : (
              <span className="font-semibold text-lg">SurgiScan</span>
            )}
          </Link>
        </div>
        
        {/* For medium screens and up, show the organization switcher in the header */}
        {!isPublicPath && user && orgContext?.currentOrganization && (
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <div className="bg-white dark:bg-gray-900 shadow-md rounded-md p-2 border border-gray-200 dark:border-gray-700 z-50">
              <OrganizationSwitcher />
            </div>
          </div>
        )}
        
        {user && (
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {!isPublicPath && orgContext && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <DashboardSidebar />
                </SheetContent>
              </Sheet>
            )}
            <UserMenu />
          </div>
        )}
        
        {!user && (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                Login
              </Button>
              <Button variant="ghost" size="sm" className="md:hidden">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderComponent;
