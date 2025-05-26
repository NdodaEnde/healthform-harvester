import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, User, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';
import { patientDataService } from '@/services/patientDataService';
import type { DatabasePatient } from '@/types/database';

interface PatientWithDocCount extends DatabasePatient {
  documentCount: number;
}

interface PatientListProps {
  organizationId: string;
  clientOrganizationId?: string;
}

const PatientList: React.FC<PatientListProps> = ({ organizationId, clientOrganizationId }) => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientWithDocCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const safeFormatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        console.warn('Invalid date:', dateString);
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      const patientsData = await patientDataService.fetchPatientsList(organizationId, clientOrganizationId);
      
      // Fetch document counts for each patient
      const patientIds = patientsData.map(p => p.id).filter(Boolean);
      const documentCounts: { [key: string]: number } = {};
      
      if (patientIds.length > 0) {
        try {
          const { data: documentsData, error: documentsError } = await supabase
            .from('documents')
            .select('owner_id')
            .in('owner_id', patientIds.filter(Boolean) as unknown as readonly string[])
            .eq('organization_id', organizationId as unknown as string);

          if (documentsError) {
            console.error('Error fetching document counts:', documentsError);
          } else if (documentsData && Array.isArray(documentsData)) {
            documentsData.forEach(doc => {
              if (doc?.owner_id) {
                const ownerId = doc.owner_id;
                documentCounts[ownerId] = (documentCounts[ownerId] || 0) + 1;
              }
            });
          }
        } catch (error) {
          console.error('Error fetching document counts:', error);
        }
      }

      // Combine patient data with document counts
      const patientsWithCounts: PatientWithDocCount[] = patientsData.map(patient => ({
        ...patient,
        documentCount: documentCounts[patient.id] || 0
      }));

      setPatients(patientsWithCounts);
    } catch (error) {
      console.error('Error in fetchPatients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchPatients();
    }
  }, [organizationId, clientOrganizationId]);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      (patient.id_number && patient.id_number.toLowerCase().includes(searchLower))
    );
  });

  const handlePatientClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleAddPatient = () => {
    navigate('/patients/new');
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
                <User className="h-5 w-5" />
                Patients
              </CardTitle>
              <CardDescription>
                Manage patient records and medical documentation
              </CardDescription>
            </div>
            <Button onClick={handleAddPatient}>
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
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No Patients Found' : 'No Patients'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'No patients match your search criteria.'
                  : 'No patients have been added to your organization yet.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleAddPatient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handlePatientClick(patient.id)}
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
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          DOB: {safeFormatDate(patient.date_of_birth)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {patient.documentCount} document{patient.documentCount !== 1 ? 's' : ''}
                        </span>
                        <span>
                          Added: {safeFormatDate(patient.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {patient.documentCount > 0 ? (
                        <Badge variant="default">{patient.documentCount} docs</Badge>
                      ) : (
                        <Badge variant="secondary">No docs</Badge>
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
