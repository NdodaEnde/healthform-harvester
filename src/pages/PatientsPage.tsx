
import React from 'react';
import { motion } from 'framer-motion';
import PatientList from '@/components/PatientList';
import { useOrganization } from '@/contexts/OrganizationContext';

const PatientsPage = () => {
  const { currentOrganization, currentClient } = useOrganization();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  return (
    <div className="mt-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
        <p className="text-muted-foreground mt-1">
          {contextLabel ? `Managing patients for ${contextLabel}` : "Manage your patients"}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PatientList />
      </motion.div>
    </div>
  );
};

export default PatientsPage;
