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

// Define the complete raw patient data interface to match database fields
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
  // Added fields for South African ID
  id_number?: string;
  id_number_valid?: boolean;
  id_number_validated?: boolean; // For backwards compatibility
  birthdate_from_id?: string;
  gender_from_id?: 'male' | 'female' | null;
  citizenship_status?: 'citizen' | 'permanent_resident' | null;
  // Also include older fields so TypeScript doesn't complain
  age_at_registration?: number;
  citizenship?: string;
}

const PatientList = () => {
  // ... keep existing code
};
