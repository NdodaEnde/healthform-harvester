
import React, { useState, useRef, useEffect } from 'react';
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
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  ChevronDown
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
import { format as formatDate, subDays, isValid, parseISO, parse, differenceInYears } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { PatientInfo, ContactInfo, MedicalHistoryData } from '@/types/patient';
import { formatSafeDateEnhanced, calculateAgeEnhanced, getEffectiveGenderEnhanced } from '@/utils/date-utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PatientRaw {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_info: any;
  medical_history: any;
  organization_id: string;
  client_organization_id: string;
  created_at: string;
  updated_at: string;
  id_number?: string;
  id_number_valid?: boolean;
  id_number_validated?: boolean;
  birthdate_from_id?: string;
  gender_from_id?: 'male' | 'female' | null;
  citizenship_status?: 'citizen' | 'permanent_resident' | null;
  age_at_registration?: number;
  citizenship?: string;
}

const PatientList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterCitizenship, setFilterCitizenship] = useState('');
  const [sortColumn, setSortColumn] = useState('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [dateOfBirthRange, setDateOfBirthRange] = useState<Date | undefined>();
  const [isGridView, setIsGridView] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const navigate = useNavigate();
  const { currentOrganization, currentClient } = useOrganization();
  const organizationId = currentOrganization?.id;
  const clientOrganizationId = currentClient?.id;

  const { data: patientsData, isLoading, error, refetch } = useQuery({
    queryKey: ['patients', organizationId, clientOrganizationId, searchQuery, filterGender, filterCitizenship, sortColumn, sortDirection],
    queryFn: async () => {
      if (!organizationId) {
        console.warn('Organization ID is missing.');
        return [];
      }

      let query = supabase
        .from('patients')
        .select('*');

      // Apply organization filter if available
      if (organizationId) {
        query = query.eq('organization_id', organizationId as string);
      }

      // Apply client organization filter if available
      if (clientOrganizationId) {
        query = query.eq('client_organization_id', clientOrganizationId as string);
      } else {
        query = query.is('client_organization_id', null);
      }

      // Apply search filter if available
      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,id_number.ilike.%${searchQuery}%`
        );
      }

      // Apply gender filter if available
      if (filterGender) {
        query = query.eq('gender', filterGender as string);
      }

      // Apply citizenship filter if available
      if (filterCitizenship) {
        query = query.eq('citizenship_status', filterCitizenship as string);
      }

      // Apply sorting
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching patients:', error);
        throw new Error(error.message);
      }

      return data as PatientRaw[] || [];
    },
    enabled: !!organizationId
  });

  useEffect(() => {
    refetch();
  }, [clientOrganizationId, refetch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleGenderFilterChange = (value: string) => {
    setFilterGender(value);
    setCurrentPage(1);
  };

  const handleCitizenshipFilterChange = (value: string) => {
    setFilterCitizenship(value);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setDateOfBirthRange(date);
  };

  const clearDateFilter = () => {
    setDateOfBirthRange(undefined);
    setSelectedDate(undefined);
  };

  const filteredPatients = React.useMemo(() => {
    if (!patientsData) return [];

    let filtered = [...patientsData];

    if (dateOfBirthRange) {
      filtered = filtered.filter(patient => {
        const dob = parseISO(patient.date_of_birth);
        return isValid(dob) && formatDate(dob, 'yyyy-MM-dd') === formatDate(dateOfBirthRange, 'yyyy-MM-dd');
      });
    }

    return filtered;
  }, [patientsData, dateOfBirthRange]);

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const addPatient = () => {
    navigate('/patients/new');
  };

  const toggleView = () => {
    setIsGridView(!isGridView);
  };

  const refreshData = () => {
    refetch();
    toast({
      title: "Refreshing Data",
      description: "The patient list is being updated.",
    })
  };

  if (isLoading) {
    return <div>Loading patients...</div>;
  }

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="md:w-80"
          />
          <Search className="h-5 w-5 text-gray-500 -ml-8" />
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <Select onValueChange={handleGenderFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Gender" defaultValue={filterGender} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={handleCitizenshipFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Citizenship" defaultValue={filterCitizenship} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Citizenships</SelectItem>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <p className="text-sm font-medium leading-none mb-2">Filter by Date of Birth</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={formatDate ? "w-full justify-start text-left font-normal" : "w-full justify-start font-normal"}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? formatDate(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center" side="bottom">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) =>
                          date > new Date() || date < subDays(new Date(), 365 * 100)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {dateOfBirthRange && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={clearDateFilter}>
                      Clear Date Filter
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={toggleView}>
            {isGridView ? (
              <>
                <ListIcon className="h-4 w-4 mr-2" />
                List View
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid View
              </>
            )}
          </Button>
          <Button size="sm" onClick={addPatient}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      {isGridView ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient as unknown as PatientInfo} />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('last_name')}>
                Name
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('date_of_birth')}>
                Date of Birth
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('gender')}>
                Gender
              </TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Medical Info</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPatients.map((patient) => {
              const contactInfo = patient.contact_info as ContactInfo || {};
              const medicalHistory = patient.medical_history as MedicalHistoryData || {};
              const age = calculateAgeEnhanced(patient.date_of_birth);
              const gender = getEffectiveGenderEnhanced(patient as unknown as PatientInfo);
              const dobFormatted = formatSafeDateEnhanced(patient.date_of_birth);

              return (
                <TableRow key={patient.id}>
                  <TableCell>
                    {patient.first_name} {patient.last_name}
                    {patient.id_number_valid === false && (
                      <Badge variant="destructive" className="ml-2">
                        Invalid ID
                      </Badge>
                    )}
                    {patient.id_number_valid === true && (
                      <Badge variant="secondary" className="ml-2">
                        Valid ID
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{dobFormatted} ({age} years)</TableCell>
                  <TableCell>{gender}</TableCell>
                  <TableCell>
                    {contactInfo.email && <p>Email: {contactInfo.email}</p>}
                    {contactInfo.phone && <p>Phone: {contactInfo.phone}</p>}
                  </TableCell>
                  <TableCell>
                    {medicalHistory.has_allergies && <p>Allergies: Yes</p>}
                    {medicalHistory.has_diabetes && <p>Diabetes: Yes</p>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/patients/edit/${patient.id}`)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/patients/detail/${patient.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {filteredPatients.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500">No patients found.</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
              if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (pageNumber === currentPage - 3 && currentPage > 4) {
                return <PaginationEllipsis key={pageNumber} />;
              } else if (pageNumber === currentPage + 3 && currentPage < totalPages - 3) {
                return <PaginationEllipsis key={pageNumber} />;
              } else {
                return null;
              }
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default PatientList;
