
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import OrganizationSwitcher from './OrganizationSwitcher';
import {
  LogOut, 
  User,
  Moon,
  Sun
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toggle } from '@/components/ui/toggle';
import { isPublicRoute } from '@/utils/organizationContextEnforcer';

const HeaderComponent: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [organizationContext, setOrganizationContext] = useState<{
    currentOrganization: any | null;
  } | null>(null);

  // Import useOrganization only if we're not on a public route
  useEffect(() => {
    // Check if we're on a public route
    const currentPathIsPublic = isPublicRoute(location.pathname);
    
    if (!currentPathIsPublic) {
      // Dynamically import to prevent usage outside provider
      const importOrganizationContext = async () => {
        try {
          const { useOrganization } = await import('@/contexts/OrganizationContext');
          // Only attempt to use the context if we're on a non-public route
          if (typeof useOrganization === 'function') {
            try {
              const orgContext = useOrganization();
              setOrganizationContext(orgContext);
            } catch (error) {
              console.error("Failed to use Organization context:", error);
              // Gracefully handle the error - no need to set state
            }
          }
        } catch (error) {
          console.error("Failed to import organization context:", error);
        }
      };
      
      // Only try to use the organization context on non-public routes
      importOrganizationContext();
    }
  }, [location.pathname]);

  // Check for user's preferred color scheme and saved preference
  useEffect(() => {
    // Check for saved preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // If no saved preference, use system preference
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  // Get current organization logo if available
  const getCurrentOrgLogo = () => {
    return organizationContext?.currentOrganization?.logo_url || null;
  };

  // Get current organization name if available
  const getCurrentOrgName = () => {
    return organizationContext?.currentOrganization?.name || 'DocManager';
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center mr-4">
            {getCurrentOrgLogo() ? (
              <img 
                src={getCurrentOrgLogo()} 
                alt={`${getCurrentOrgName()} logo`}
                className="h-8 w-auto mr-2"
              />
            ) : (
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                DocManager
              </div>
            )}
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <Toggle 
            variant="outline" 
            aria-label="Toggle dark mode" 
            pressed={isDarkMode}
            onPressedChange={toggleDarkMode}
            className="rounded-full p-2"
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            <span className="sr-only">Toggle dark mode</span>
          </Toggle>

          {user ? (
            <>
              {/* Only show OrganizationSwitcher on protected routes and when context is available */}
              {organizationContext?.currentOrganization && !isPublicRoute(location.pathname) && (
                <OrganizationSwitcher />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent;
