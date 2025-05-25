import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Search, Plus, User, Calendar, FileText, Building2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  id_number: string | null;
  contact_info: any;
  created_at: string;
  organization_id: string;
  client_organization_id: string | null;
}

interface Organization {
  id: string;
  name: string;
}

interface PatientListProps {
  organizationId: string;
  clientOrganizationId?: string;
}

const PatientList = ({ organizationId, clientOrganizationId }: PatientListProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("patients")
        .select("*")
        .eq("organization_id" as any, organizationId as any);

      if (clientOrganizationId) {
        query = query.eq("client_organization_id" as any, clientOrganizationId as any);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error);
        toast.error("Failed to load patients");
        return;
      }

      if (data && Array.isArray(data)) {
        const typedPatients: Patient[] = data
          .filter((item: any) => item !== null && typeof item === 'object')
          .map((item: any) => ({
            id: item.id || '',
            first_name: item.first_name || '',
            last_name: item.last_name || '',
            date_of_birth: item.date_of_birth || '',
            gender: item.gender || null,
            id_number: item.id_number || null,
            contact_info: item.contact_info || null,
            created_at: item.created_at || '',
            organization_id: item.organization_id || '',
            client_organization_id: item.client_organization_id || null
          }));
        
        setPatients(typedPatients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name");

      if (error) {
        console.error("Error fetching organizations:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        const typedOrgs: Organization[] = data
          .filter((item: any) => item !== null && typeof item === 'object')
          .map((item: any) => ({
            id: item.id || '',
            name: item.name || ''
          }));
        
        setOrganizations(typedOrgs);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchPatients();
      fetchOrganizations();
    }
  }, [organizationId, clientOrganizationId]);

  const getOrganizationName = (orgId: string | null) => {
    if (!orgId) return "Unknown";
    const org = organizations.find(o => o.id === orgId);
    return org?.name || "Unknown";
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.id_number && patient.id_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const checkDocumentStatus = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, status, document_type')
        .eq('owner_id' as any, patientId as any)
        .eq('organization_id' as any, organizationId as any);

      if (error) {
        console.error('Error checking documents:', error);
        return { hasDocuments: false, hasCertificates: false };
      }

      if (!data) {
        return { hasDocuments: false, hasCertificates: false };
      }

      const hasDocuments = data.length > 0;
      const hasCertificates = data.some((doc: any) => 
        doc && doc.document_type && 
        ['certificate-fitness', 'certificate', 'medical-certificate'].includes(doc.document_type)
      );

      return { hasDocuments, hasCertificates };
    } catch (error) {
      console.error('Error checking documents:', error);
      return { hasDocuments: false, hasCertificates: false };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Patients</h2>
          <Button onClick={() => navigate("/patients/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
        <div className="text-center py-8">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Patients</h2>
        <Button onClick={() => navigate("/patients/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search patients by name or ID number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Patients Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No patients match your search criteria." : "Get started by adding your first patient."}
            </p>
            <Button onClick={() => navigate("/patients/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader onClick={() => navigate(`/patients/${patient.id}`)}>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {patient.first_name} {patient.last_name}
                </CardTitle>
                <CardDescription>
                  {patient.id_number && (
                    <div className="text-sm">ID: {patient.id_number}</div>
                  )}
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    DOB: {format(new Date(patient.date_of_birth), "MMM d, yyyy")}
                  </div>
                  {patient.gender && (
                    <div className="text-sm">Gender: {patient.gender}</div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>Org: {getOrganizationName(patient.organization_id)}</span>
                  </div>
                  
                  {patient.client_organization_id && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>Client: {getOrganizationName(patient.client_organization_id)}</span>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Added: {format(new Date(patient.created_at), "MMM d, yyyy")}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/patients/${patient.id}/edit`)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;
