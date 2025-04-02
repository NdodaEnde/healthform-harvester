
import React from 'react';
import { motion } from 'framer-motion';
import PatientList from '@/components/PatientList';
import { useOrganization } from '@/contexts/OrganizationContext';

const PatientsPage = () => {
  const { currentOrganization, currentClient } = useOrganization();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  return (
    <div className="mt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg"
      >
        <PatientList />
      </motion.div>
    </div>
  );
};

export default PatientsPage;
