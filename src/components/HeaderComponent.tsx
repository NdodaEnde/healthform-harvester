
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import OrganizationSwitcher from './OrganizationSwitcher';
import ClientSwitcher from './ClientSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsDropdown } from './NotificationsDropdown';
import { supabase } from '@/integrations/supabase/client';

const HeaderComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, isLoading, signOut } = useAuth();
  const { 
    currentOrganization, 
    isServiceProvider, 
    loading: orgLoading 
  } = useOrganization();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : '?';

  const isPublicRoute = ['/auth', '/', '/reset-password', '/update-password', '/accept-invite'].includes(location.pathname);

  if (isLoading || orgLoading) {
    return (
      <header className="border-b h-16 flex items-center px-6 sticky top-0 z-50 w-full bg-white dark:bg-gray-950">
        <div className="h-5 w-5 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
      </header>
    );
  }

  // For public routes, show a simplified header
  if (isPublicRoute) {
    return (
      <header className="border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50 w-full bg-white dark:bg-gray-950">
        <div className="flex-1">
          <Link to="/" className="font-semibold text-lg">MediCert</Link>
        </div>
        <div>
          {isAuthenticated ? (
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50 w-full bg-white dark:bg-gray-950">
      <div className="flex flex-1 items-center">
        <Link to="/" className="font-semibold text-lg mr-6">MediCert</Link>
        
        {isAuthenticated && currentOrganization && (
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link to="/patients" className="text-sm font-medium transition-colors hover:text-primary">
              Patients
            </Link>
          </div>
        )}
      </div>
      
      {isAuthenticated && (
        <div className="flex items-center space-x-4">
          {isServiceProvider() && <ClientSwitcher />}
          <OrganizationSwitcher />
          <NotificationsDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/settings/organization')}>
                Organization Settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/settings/certificate-templates')}>
                Certificate Templates
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
};

export default HeaderComponent;
