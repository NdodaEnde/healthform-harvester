
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PatientList from '@/components/PatientList';
import { useOrganization } from '@/contexts/OrganizationContext';

const PatientsPage = () => {
  const { currentOrganization, currentClient } = useOrganization();
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
        {contextLabel && (
          <div className="mb-4">
            <span className="text-sm text-gray-500">Viewing patients for: </span>
            <span className="font-medium">{contextLabel}</span>
          </div>
        )}
        
        {/* Patient List Component - the main focus of the page */}
        {currentOrganization && (
          <PatientList 
            clientOrganizationId={currentClient?.id}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PatientsPage;
