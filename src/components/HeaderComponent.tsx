
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu } from 'lucide-react';
import OrganizationSwitcher from './OrganizationSwitcher';
import ClientSwitcher from './ClientSwitcher';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useMobileMenu } from '@/hooks/use-mobile';
import NotificationsDropdown from './NotificationsDropdown';

const HeaderComponent = () => {
  const auth = useAuth();
  const { isOpen, toggle } = useMobileMenu();
  const { 
    currentOrganization,
    isServiceProvider
  } = useOrganization();
  
  // Extract these from the auth context with proper fallbacks
  const isAuthenticated = !!auth.session;
  const isLoading = auth.isLoading || false;
  const profile = auth.user || null;

  if (isLoading) {
    return (
      <header className="border-b bg-background">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold">Medical Portal</Link>
          </div>
          <div className="animate-pulse h-10 w-24 bg-gray-200 rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden mr-2" 
              onClick={toggle}
            >
              <Menu />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          
          <Link to="/" className="text-xl font-bold">Medical Portal</Link>
          
          {isAuthenticated && currentOrganization && (
            <div className="hidden md:flex items-center space-x-2">
              <OrganizationSwitcher />
              {isServiceProvider() && <ClientSwitcher />}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <div className="hidden md:block">
                <NotificationsDropdown />
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium hidden md:inline-block">
                  {profile?.email ? profile.email.split('@')[0] : 'User'}
                </span>
                
                <Link to="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => auth.signOut()}
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent;
