
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import PatientCard from './PatientCard';
import { Search, Plus, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>("all");
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    currentClient, 
    getEffectiveOrganizationId 
  } = useOrganization();
  
  // Get the effective organization ID (client or current org)
  const organizationId = getEffectiveOrganizationId();
  
  // Query patients with organization context
  const { data: patients, isLoading, error, refetch } = useQuery({
    queryKey: ['patients', organizationId, searchTerm, filterGender],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*');
      
      // Apply organization filtering
      if (currentClient) {
        // If viewing as a service provider with a client selected
        query = query.eq('client_organization_id', currentClient.id);
      } else if (organizationId) {
        // If viewing own organization
        query = query.eq('organization_id', organizationId);
      }
      
      // Apply search term filter
      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }
      
      // Apply gender filter (only if not "all")
      if (filterGender && filterGender !== "all") {
        query = query.eq('gender', filterGender);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching patients: ${error.message}`);
      }
      
      console.log('Patients fetched:', data?.length, 'Query params:', { organizationId, searchTerm, filterGender });
      
      if (!data || data.length === 0) {
        console.log('No patients found for this organization. Organization ID:', organizationId);
      } else {
        console.log('Retrieved patients:', data.map(p => ({
          id: p.id, 
          name: `${p.first_name} ${p.last_name}`,
          gender: p.gender
        })));
      }
      
      return data || [];
    },
    enabled: !!organizationId,
  });

  const handleAddPatient = () => {
    navigate('/patients/new');
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select onValueChange={setFilterGender} value={filterGender}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} className="mr-2">
            Refresh
          </Button>
          
          <Button onClick={handleAddPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading patients: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      ) : !patients?.length ? (
        <div className="text-center py-8 border rounded-lg bg-background">
          <h3 className="text-lg font-medium mb-2">No patients found</h3>
          <p className="text-muted-foreground mb-4">Patients will be automatically created when documents are processed</p>
          <Button variant="outline" onClick={handleAddPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient Manually
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;
