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
import { format, subDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { PatientInfo, ContactInfo, MedicalHistoryData } from '@/types/patient';
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

const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [dateFilter, setDateFilter] = useState<{
    label: string;
    startDate: Date | null;
    endDate: Date | null;
  }>({ label: "All time", startDate: null, endDate: null });
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
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
    queryKey: ['patients', organizationId, searchTerm, filterGender, dateFilter],
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
      
      // Apply date filter if set
      if (dateFilter.startDate && dateFilter.endDate) {
        query = query.gte('created_at', dateFilter.startDate.toISOString())
                    .lte('created_at', dateFilter.endDate.toISOString());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching patients: ${error.message}`);
      }
      
      console.log('Patients fetched:', data?.length, 'Query params:', { 
        organizationId, 
        searchTerm, 
        filterGender,
        dateFilter: dateFilter.label
      });
      
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

  // Query for documents to get certification status information
  const { data: documentsData } = useQuery({
    queryKey: ['documents-status', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId
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

  // Date filter presets
  const datePresets = [
    { label: "All time", days: null },
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "Custom range", days: 'custom' }
  ];

  const handleDateFilterChange = (preset: { label: string, days: number | null | 'custom' }) => {
    if (preset.days === null) {
      // All time
      setDateFilter({ label: preset.label, startDate: null, endDate: null });
    } else if (preset.days === 'custom') {
      // Custom range - leave the current filter and open the calendar popover
      return;
    } else {
      // Specific days
      const endDate = new Date();
      const startDate = subDays(endDate, preset.days);
      setDateFilter({ label: preset.label, startDate, endDate });
    }
  };

  // Set custom date from calendar
  const handleSetCustomDate = (date: Date | null) => {
    if (!date) return;
    
    setCalendarDate(date);
    // When a single date is selected, show patients from that day only
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    setDateFilter({ 
      label: `${format(date, 'PP')}`, 
      startDate: startOfDay, 
      endDate: endOfDay 
    });
  };

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

  // Export patients function
  const exportPatients = (format: 'csv' | 'excel' | 'pdf') => {
    // Here we'll implement a simple CSV export
    if (format === 'csv') {
      try {
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // CSV Headers
        const headers = [
          "ID", "First Name", "Last Name", "Gender", "Date of Birth", 
          "Age", "Email", "Phone", "Status", "Created"
        ];
        csvContent += headers.join(",") + "\n";
        
        // CSV Data
        patients.forEach(patient => {
          const age = calculateAge(patient.date_of_birth);
          const email = patient.contact_info?.email || '';
          const phone = patient.contact_info?.phone || '';
          
          let status = "Unknown";
          if (patient.medical_history?.assessment?.fitness_conclusion) {
            const conclusion = patient.medical_history.assessment.fitness_conclusion.toLowerCase();
            
            if (conclusion.includes("fit") || conclusion.includes("suitable")) {
              status = "Fit";
            } else if (conclusion.includes("unfit") || conclusion.includes("not suitable")) {
              status = "Unfit";
            } else if (conclusion.includes("temporarily") || conclusion.includes("conditional")) {
              status = "Conditional";
            }
          }
          
          const row = [
            patient.id,
            patient.first_name,
            patient.last_name,
            patient.gender || "Unknown",
            patient.date_of_birth,
            age.toString(),
            `"${email}"`, // Wrap in quotes to handle commas
            `"${phone}"`,
            status,
            format(new Date(patient.created_at), 'yyyy-MM-dd')
          ];
          
          // Escape any commas in the data
          csvContent += row.join(",") + "\n";
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `patients_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        
        // Download the CSV
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export Successful",
          description: `${patients.length} patients exported as CSV.`,
        });
      } catch (err) {
        console.error("Export error:", err);
        toast({
          title: "Export Failed",
          description: "There was an error exporting the patients data.",
          variant: "destructive",
        });
      }
    } else {
      // For other formats, we'll just show a toast for now
      toast({
        title: `${format.toUpperCase()} Export`,
        description: `${format.toUpperCase()} export is not implemented yet.`,
      });
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(date_of_birth);
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

  // Calculate metrics for corporate health insights
  const calculateCorporateHealthMetrics = () => {
    // Default values if data is not available
    const metrics = {
      certificateStatus: {
        fit: { count: 0, title: 'Fit for Work', description: 'No restrictions' },
        conditional: { count: 0, title: 'Conditional', description: 'With restrictions' },
        unfit: { count: 0, title: 'Unfit', description: 'Temporarily or permanently' },
        pending: { count: 0, title: 'Pending Review', description: 'Awaiting assessment' }
      }
    };

    // Count patients with different certificate statuses
    patients.forEach(patient => {
      if (patient.medical_history?.assessment?.fitness_conclusion) {
        const conclusion = patient.medical_history.assessment.fitness_conclusion.toLowerCase();
        
        if (conclusion.includes("fit") || conclusion.includes("suitable")) {
          metrics.certificateStatus.fit.count++;
        } else if (conclusion.includes("temporarily") || conclusion.includes("conditional")) {
          metrics.certificateStatus.conditional.count++;
        } else if (conclusion.includes("unfit") || conclusion.includes("not suitable")) {
          metrics.certificateStatus.unfit.count++;
        } 
      } else {
        // If no assessment, count as pending
        metrics.certificateStatus.pending.count++;
      }
    });

    return metrics;
  };

  const corporateMetrics = calculateCorporateHealthMetrics();

  // Calculate document processing stats
  const calculateDocumentStats = () => {
    if (!documentsData) return { processed: 0, processing: 0, failed: 0, total: 0 };
    
    const stats = {
      processed: 0,
      processing: 0,
      failed: 0,
      total: documentsData.length
    };

    documentsData.forEach(doc => {
      if (doc.status === 'processed') {
        stats.processed++;
      } else if (doc.status === 'processing') {
        stats.processing++;
      } else if (doc.status === 'failed') {
        stats.failed++;
      }
    });

    return stats;
  };

  const documentStats = calculateDocumentStats();

  // Calculate compliance rate
  const calculateComplianceRate = () => {
    const totalPatients = patients.length;
    if (totalPatients === 0) return 0;

    const patientsWithValidCertificates = patients.filter(p => 
      p.medical_history?.assessment?.fitness_conclusion && 
      !p.medical_history?.assessment?.expired
    ).length;

    return Math.round((patientsWithValidCertificates / totalPatients) * 100);
  };

  const complianceRate = calculateComplianceRate();

  // Calculate review deadline metrics
  const calculateReviewDeadlines = () => {
    const today = new Date();
    let dueSoon = 0;
    let overdue = 0;

    patients.forEach(patient => {
      if (patient.medical_history?.assessment?.next_assessment) {
        const nextReviewDate = new Date(patient.medical_history.assessment.next_assessment);
        const daysDiff = Math.floor((nextReviewDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (daysDiff < 0) {
          overdue++;
        } else if (daysDiff <= 30) {
          dueSoon++;
        }
      }
    });

    return { dueSoon, overdue };
  };

  const reviewDeadlines = calculateReviewDeadlines();

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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 border-purple-200 text-purple-700">
                <Calendar className="h-4 w-4" />
                <span>{dateFilter.label}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" align="end">
              <div className="border-b p-2">
                <div className="grid gap-1">
                  {datePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      className="justify-start font-normal"
                      onClick={() => handleDateFilterChange(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-2">
                <CalendarComponent
                  mode="single"
                  selected={calendarDate || undefined}
                  onSelect={(date) => handleSetCustomDate(date)}
                />
              </div>
            </PopoverContent>
          </Popover>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-purple-200 text-purple-700">
                <Download className="h-4 w-4" />
                <span>Export</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportPatients('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPatients('excel')}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPatients('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleAddPatient} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
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
