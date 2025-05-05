
import React from 'react';

interface OrganizationLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackText?: string;
  organization?: {
    name?: string;
    logo_url?: string;
  } | null;
}

const OrganizationLogo: React.FC<OrganizationLogoProps> = ({ 
  size = 'md', 
  className = '', 
  fallbackText = 'DocManager',
  organization = null
}) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto'
  };
  
  if (!organization?.logo_url) {
    return (
      <div className={`font-bold text-gray-900 dark:text-gray-100 ${className}`}>
        {fallbackText}
      </div>
    );
  }
  
  return (
    <img 
      src={organization.logo_url} 
      alt={`${organization.name || 'Organization'} logo`}
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default OrganizationLogo;
