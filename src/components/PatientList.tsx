import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import PatientCard from './PatientCard';
import { 
  Search, 
  Plus, 
  Filter, 
  RefreshCw, 
  LayoutGrid, 
  List as ListIcon,
  Calendar,
  Download 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { PatientInfo, ContactInfo, MedicalHistoryData } from '@/types/patient';
import { Json } from '@/integrations/supabase/types';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    currentClient, 
    getEffectiveOrganizationId 
  } = useOrganization();
  
  // Get the effective organization ID (client or current org)
  const organizationId = getEffectiveOrganizationId();
  
  // Query patients with organization context
  const { data: patientsData, isLoading, error, refetch } = useQuery({
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

  // Convert raw database patients to PatientInfo type
  const patients: PatientInfo[] = patientsData?.map(p => {
    // Handle contact_info conversion from Json to ContactInfo
    let contactInfo: ContactInfo | null = null;
    if (p.contact_info) {
      if (typeof p.contact_info === 'string') {
        try {
          contactInfo = JSON.parse(p.contact_info);
        } catch (e) {
          console.error("Failed to parse contact_info string:", e);
        }
      } else {
        contactInfo = p.contact_info as ContactInfo;
      }
    }

    // Handle medical_history conversion
    let medicalHistory: MedicalHistoryData | null = null;
    if (p.medical_history) {
      if (typeof p.medical_history === 'string') {
        try {
          medicalHistory = JSON.parse(p.medical_history);
        } catch (e) {
          console.error("Failed to parse medical_history string:", e);
        }
      } else {
        medicalHistory = p.medical_history as MedicalHistoryData;
      }
    }

    return {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth,
      gender: p.gender,
      contact_info: contactInfo,
      medical_history: medicalHistory,
      organization_id: p.organization_id,
      client_organization_id: p.client_organization_id,
      created_at: p.created_at,
      updated_at: p.updated_at
    };
  }) || [];

  const handleAddPatient = () => {
    navigate('/patients/new');
  };

  const handleRefresh = () => {
    toast({
      title: "Refreshing patients list",
      description: "The patients list is being updated."
    });
    refetch();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getStatusBadge = (patient: PatientInfo) => {
    let status = "Unknown";
    let variant: "default" | "secondary" | "outline" | "destructive" | "success" = "secondary";

    // Try to determine status from medical_history if available
    if (patient.medical_history?.assessment?.fitness_conclusion) {
      const conclusion = patient.medical_history.assessment.fitness_conclusion.toLowerCase();
      
      if (conclusion.includes("fit") || conclusion.includes("suitable")) {
        status = "Fit";
        variant = "success";
      } else if (conclusion.includes("unfit") || conclusion.includes("not suitable")) {
        status = "Unfit";
        variant = "destructive";
      } else if (conclusion.includes("temporarily") || conclusion.includes("conditional")) {
        status = "Conditional";
        variant = "outline";
      }
    }

    return (
      <Badge variant={variant} className={
        variant === "success" 
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
          : variant === "destructive" 
            ? "bg-red-100 text-red-800 hover:bg-red-200" 
            : variant === "outline"
              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
              : ""
      }>
        {status}
      </Badge>
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(patients.length / pageSize);
  const paginatedPatients = patients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate statistics for age groups
  const patientAgeGroups = {
    child: { count: 0, title: 'Child', description: '' },
    teen: { count: 0, title: 'Teen', description: '' },
    adult: { count: 0, title: 'Adult', description: '' },
    older: { count: 0, title: 'Older', description: '' }
  };

  // Calculate statistics for age groups
  if (patients?.length) {
    patients.forEach(patient => {
      const age = calculateAge(patient.date_of_birth);
      if (age < 13) {
        patientAgeGroups.child.count++;
      } else if (age < 20) {
        patientAgeGroups.teen.count++;
      } else if (age < 65) {
        patientAgeGroups.adult.count++;
      } else {
        patientAgeGroups.older.count++;
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-purple-800">Patients</h2>
          <p className="text-muted-foreground mt-1">
            View and update detailed patient profiles
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2 border-purple-200 text-purple-700" onClick={() => {}}>
            <Calendar className="h-4 w-4" />
            <span>Days</span>
          </Button>
          
          <Button variant="outline" className="gap-2 border-purple-200 text-purple-700" onClick={() => {}}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          
          <Button onClick={handleAddPatient} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Age Group Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(patientAgeGroups).map(([key, group]) => (
          <div 
            key={key} 
            className="bg-white rounded-lg shadow p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">{group.title}</h3>
              <Button variant="outline" size="sm" className="text-xs h-7 px-2 border-purple-200 text-purple-700">
                See Details
              </Button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800">{group.count}</span>
              <span className="text-sm text-green-500">+{Math.round(group.count * 0.05)}</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {/* This would be populated with actual data in a real application */}
              {key === 'child' && 'Common conditions: asthma, immunizations'}
              {key === 'teen' && 'Common conditions: acne, sports injuries'}
              {key === 'adult' && 'Common conditions: hypertension, diabetes'}
              {key === 'older' && 'Common conditions: arthritis, heart disease'}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 border-purple-100 focus:border-purple-300"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select onValueChange={setFilterGender} value={filterGender}>
            <SelectTrigger className="w-[180px] border-purple-100">
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
          
          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
            className="border-purple-200 text-purple-700"
          >
            {viewMode === 'card' ? (
              <>
                <ListIcon className="mr-2 h-4 w-4" />
                List View
              </>
            ) : (
              <>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Card View
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={handleRefresh} className="border-purple-200 text-purple-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
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
        <div className="text-center py-8 border rounded-lg bg-white shadow">
          <h3 className="text-lg font-medium mb-2">No patients found</h3>
          <p className="text-muted-foreground mb-4">Patients will be automatically created when documents are processed</p>
          <Button variant="outline" onClick={handleAddPatient} className="border-purple-200 text-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient Manually
          </Button>
        </div>
      ) : viewMode === 'card' ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => goToPage(currentPage - 1)} 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum: number;
                  
                  // Logic to show correct page numbers based on current page
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                    if (i === 4) return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                    if (i === 0) return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  } else {
                    if (i === 0) return (
                      <PaginationItem key={i}>
                        <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
                      </PaginationItem>
                    );
                    if (i === 1) return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                    if (i === 3) return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                    if (i === 4) return (
                      <PaginationItem key={i}>
                        <PaginationLink onClick={() => goToPage(totalPages)}>{totalPages}</PaginationLink>
                      </PaginationItem>
                    );
                    pageNum = currentPage + i - 2;
                  }
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={pageNum === currentPage}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => goToPage(currentPage + 1)} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.map((patient, index) => {
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium">
                            {patient.first_name[0]}{patient.last_name[0]}
                          </div>
                          <div>
                            <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                            <div className="text-sm text-muted-foreground">ID: {patient.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{calculateAge(patient.date_of_birth)}</TableCell>
                      <TableCell className="capitalize">{patient.gender || 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(patient.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {patient.contact_info?.email ? (
                          <div className="text-sm text-blue-600">{patient.contact_info.email}</div>
                        ) : patient.contact_info?.phone ? (
                          <div className="text-sm">{patient.contact_info.phone}</div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No contact info</div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(patient)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            className="h-8 px-2 text-purple-700"
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/patients/${patient.id}/edit`)}
                            className="h-8 px-2 text-purple-700"
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => goToPage(currentPage - 1)} 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum: number;
                  
                  // Logic to show correct page numbers based on current page
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                    if (i === 4) return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                    if (i === 0) return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  } else {
                    if (i === 0) return (
                      <PaginationItem key={i}>
                        <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
                      </PaginationItem>
                    );
                    if (i === 1) return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                    if (i === 3) return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                    if (i === 4) return (
                      <PaginationItem key={i}>
                        <PaginationLink onClick={() => goToPage(totalPages)}>{totalPages}</PaginationLink>
                      </PaginationItem>
                    );
                    pageNum = currentPage + i - 2;
                  }
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={pageNum === currentPage}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => goToPage(currentPage + 1)} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default PatientList;
