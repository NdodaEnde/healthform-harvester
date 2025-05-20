
import React from 'react';

interface OrganizationLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackText?: string;
  organization?: {
    name?: string;
    logo_url?: string;
    signature_url?: string;
    stamp_url?: string;
  } | null;
  variant?: 'logo' | 'signature' | 'stamp';
}

const OrganizationLogo: React.FC<OrganizationLogoProps> = ({ 
  size = 'md', 
  className = '', 
  fallbackText = 'SurgiScan',
  organization = null,
  variant = 'logo'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto'
  };
  
  // Determine which URL to use based on variant
  const getImageUrl = () => {
    if (!organization) return null;
    
    switch (variant) {
      case 'signature':
        return organization.signature_url;
      case 'stamp':
        return organization.stamp_url;
      case 'logo':
      default:
        return organization.logo_url;
    }
  };
  
  const imageUrl = getImageUrl();
  
  if (!imageUrl) {
    // For signatures and stamps, just return empty space if not available
    if (variant === 'signature' || variant === 'stamp') {
      return <div className={`${className} min-h-8`}></div>;
    }
    
    // Default fallback for logo
    return (
      <div className={`font-bold text-gray-900 dark:text-gray-100 ${className}`}>
        {fallbackText}
      </div>
    );
  }
  
  return (
    <img 
      src={imageUrl} 
      alt={`${organization?.name || 'Organization'} ${variant}`}
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default OrganizationLogo;
