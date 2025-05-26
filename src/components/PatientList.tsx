
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Edit, FileText } from 'lucide-react';
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
  created_at: string;
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
      const orgId = getEffectiveOrganizationId();
      
      if (!orgId) {
        console.log('No organization ID available');
        return;
      }

      // Check if current user has access to documents for this organization
      const { data: accessCheck } = await supabase
        .from('documents')
        .select('owner_id')
        .eq('organization_id', orgId)
        .limit(1);

      if (!accessCheck) {
        console.log('No access to organization documents');
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('organization_id', orgId)
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to load patients');
        return;
      }

      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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
                <User className="h-5 w-5" />
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
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                        <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                        {patient.gender && (
                          <Badge variant="outline">
                            {patient.gender}
                          </Badge>
                        )}
                        {patient.id_number && (
                          <span>ID: {patient.id_number}</span>
                        )}
                        <span>Added: {new Date(patient.created_at).toLocaleDateString()}</span>
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
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
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
