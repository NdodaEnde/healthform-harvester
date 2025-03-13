
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import OrganizationSwitcher from './OrganizationSwitcher';
import { Menu } from 'lucide-react';

const HeaderComponent: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Toggle mobile sidebar function (to be implemented when needed)
  const toggleMobileSidebar = () => {
    // This will be implemented when we add mobile sidebar
    console.log("Toggle mobile sidebar");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden mr-2"
              onClick={toggleMobileSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="text-xl font-bold text-gray-900 dark:text-gray-100">
            DocManager
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {currentOrganization && (
                <OrganizationSwitcher />
              )}
              <Button variant="ghost" onClick={handleSignOut}>
                Sign Out
              </Button>
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
