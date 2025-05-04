
import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

interface OrganizationLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackText?: string;
}

const OrganizationLogo: React.FC<OrganizationLogoProps> = ({ 
  size = 'md', 
  className = '', 
  fallbackText = 'DocManager' 
}) => {
  const { currentOrganization } = useOrganization();
  
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto'
  };
  
  if (!currentOrganization?.logo_url) {
    return (
      <div className={`font-bold text-gray-900 dark:text-gray-100 ${className}`}>
        {fallbackText}
      </div>
    );
  }
  
  return (
    <img 
      src={currentOrganization.logo_url} 
      alt={`${currentOrganization.name || 'Organization'} logo`}
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default OrganizationLogo;
