
import { createContext, useContext, ReactNode } from "react";
import { useOrganizationData } from "@/hooks/useOrganizationData";
import { OrganizationContextType } from "@/types/organization";

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const organizationData = useOrganizationData();
  
  return (
    <OrganizationContext.Provider value={organizationData}>
      {children}
    </OrganizationContext.Provider>
  );
}
