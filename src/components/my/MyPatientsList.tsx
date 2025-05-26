
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Edit, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';
import { NormalizedDataService } from '@/services/normalizedDataService';
import type { MyPatientWithOrganization } from '@/types/normalized-database';

interface MyPatientsListProps {
  clientOrganizationId?: string;
  onSelectPatient?: (patient: MyPatientWithOrganization) => void;
  onEditPatient?: (patient: MyPatientWithOrganization) => void;
  allowSelection?: boolean;
  allowEdit?: boolean;
}

const MyPatientsList: React.FC<MyPatientsListProps> = ({
  clientOrganizationId,
  onSelectPatient,
  onEditPatient,
  allowSelection = false,
  allowEdit = true
}) => {
  const [patients, setPatients] = useState<MyPatientWithOrganization[]>([]);
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
    if (!clientOrganizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await NormalizedDataService.getPatientsByOrganization(clientOrganizationId);
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [clientOrganizationId]);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      (patient.id_number && patient.id_number.toLowerCase().includes(searchLower))
    );
  });

  const handlePatientClick = (patient: MyPatientWithOrganization) => {
    if (allowSelection && onSelectPatient) {
      onSelectPatient(patient);
    }
  };

  const handleEditClick = (e: React.MouseEvent, patient: MyPatientWithOrganization) => {
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

  if (!clientOrganizationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select an Organization</h3>
              <p className="text-muted-foreground">
                Please select a client organization to view patients.
              </p>
            </div>
          </CardContent>
        </Card>
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
                  : 'No patients have been added to this organization yet.'
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
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          DOB: {safeFormatDate(patient.date_of_birth)}
                        </span>
                        {patient.gender && (
                          <span>Gender: {patient.gender}</span>
                        )}
                        <span className={patient.is_active ? 'text-green-600' : 'text-red-600'}>
                          {patient.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span>
                          Added: {safeFormatDate(patient.created_at)}
                        </span>
                      </div>
                      {patient.client_organization && (
                        <div className="mt-1">
                          <Badge variant="outline">
                            {patient.client_organization.name}
                          </Badge>
                        </div>
                      )}
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

export default MyPatientsList;
