
import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import OrganizationLogo from './OrganizationLogo';

interface DocumentHeaderProps {
  title: string;
  showLogo?: boolean;
  showAddress?: boolean;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ 
  title, 
  showLogo = true, 
  showAddress = true 
}) => {
  const { currentOrganization } = useOrganization();
  
  // Safely access address from organization settings
  const address = currentOrganization?.address 
    ? (typeof currentOrganization.address === 'string' 
        ? JSON.parse(currentOrganization.address) 
        : currentOrganization.address)
    : null;
    
  return (
    <div className="p-6 border-b border-gray-200 print:border-gray-300">
      <div className="flex justify-between items-start">
        {showLogo && (
          <div className="flex-shrink-0">
            <OrganizationLogo size="lg" />
          </div>
        )}
        
        <div className="text-right">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <div className="text-sm text-gray-600">
            <div className="font-semibold">{currentOrganization?.name}</div>
            {currentOrganization?.contact_email && (
              <div>{currentOrganization.contact_email}</div>
            )}
            {currentOrganization?.contact_phone && (
              <div>{currentOrganization.contact_phone}</div>
            )}
            {showAddress && address && (
              <div className="mt-1">
                {address.street && <div>{address.street}</div>}
                {address.city && address.state && address.postal_code && (
                  <div>
                    {address.city}, {address.state} {address.postal_code}
                  </div>
                )}
                {address.country && <div>{address.country}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;
