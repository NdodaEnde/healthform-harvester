
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  id_number?: string;
  client_organization_id: string;
}

interface PatientListProps {
  onSelectPatient?: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
  allowSelection?: boolean;
  allowEdit?: boolean;
}

const PatientList: React.FC<PatientListProps> = ({
  onSelectPatient,
  onEditPatient,
  allowSelection = false,
  allowEdit = true
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { getEffectiveOrganizationId } = useOrganization();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const effectiveOrgId = getEffectiveOrganizationId();
      
      if (!effectiveOrgId) {
        console.log('No effective organization ID available');
        setPatients([]);
        return;
      }

      console.log('Fetching patients for organization:', effectiveOrgId);

      // Get patient count first
      const { count: patientCount, error: countError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('client_organization_id', effectiveOrgId);

      if (countError) {
        console.error('Error counting patients:', countError);
      } else {
        console.log('Total patients found:', patientCount);
      }

      // Fetch documents count for each patient
      const { count: docCount, error: docError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('client_organization_id', effectiveOrgId);

      if (docError) {
        console.error('Error counting documents:', docError);
      } else {
        console.log('Total documents found:', docCount);
      }

      // Fetch actual patients data
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('client_organization_id', effectiveOrgId)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        throw patientsError;
      }

      console.log('Patients data received:', patientsData);
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [getEffectiveOrganizationId]);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      (patient.id_number && patient.id_number.toLowerCase().includes(searchLower))
    );
  });

  const handlePatientClick = (patient: Patient) => {
    if (allowSelection && onSelectPatient) {
      onSelectPatient(patient);
    }
  };

  const handleEditClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    if (onEditPatient) {
      onEditPatient(patient);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patients
              </CardTitle>
              <CardDescription>
                Manage patient records and information
              </CardDescription>
            </div>
            <Button onClick={() => {}}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or ID number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No Patients Found' : 'No Patients'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'No patients match your search criteria.'
                  : 'No patients have been added yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    allowSelection ? 'hover:bg-accent cursor-pointer' : ''
                  }`}
                  onClick={() => handlePatientClick(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {patient.id_number && (
                          <span>ID: {patient.id_number}</span>
                        )}
                        {patient.date_of_birth && (
                          <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                        )}
                        {patient.gender && (
                          <Badge variant="outline">{patient.gender}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {allowEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEditClick(e, patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientList;
