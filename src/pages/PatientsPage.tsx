
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PatientList from '@/components/PatientList';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building } from 'lucide-react';

const PatientsPage = () => {
  const { currentOrganization, currentClient, clientOrganizations, switchClient, isServiceProvider } = useOrganization();
  const [currentPage] = useState(1);
  const [filters] = useState({});
  const [sortOptions] = useState({ field: 'created_at', direction: 'desc' });
  
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  return (
    <div className="mt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-6">Patients</h1>
        
        {/* Show client selector for service providers */}
        {isServiceProvider() && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Select Client Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={currentClient?.id || ""}
                onValueChange={(value) => switchClient(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client organization to view patients" />
                </SelectTrigger>
                <SelectContent>
                  {clientOrganizations.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {contextLabel && (
          <div className="mb-4">
            <span className="text-sm text-gray-500">Viewing patients for: </span>
            <span className="font-medium">{contextLabel}</span>
          </div>
        )}
        
        {/* Show patients only when we have a context */}
        {(currentClient || !isServiceProvider()) ? (
          <PatientList />
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Client Organization</h3>
                <p className="text-muted-foreground">
                  Please select a client organization above to view and manage patients.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default PatientsPage;
