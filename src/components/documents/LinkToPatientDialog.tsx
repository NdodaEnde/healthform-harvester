
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, User, Link } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { DatabaseDocument, DatabasePatient } from '@/types/database';

interface LinkToPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: DatabaseDocument;
  onLinked?: () => void;
}

const LinkToPatientDialog: React.FC<LinkToPatientDialogProps> = ({
  isOpen,
  onClose,
  document,
  onLinked
}) => {
  const { currentOrganization, currentClient } = useOrganization();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<DatabasePatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const searchPatients = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const organizationId = currentClient?.id || currentOrganization?.id;
      if (!organizationId) {
        toast.error('No organization context available');
        return;
      }

      let query = supabase
        .from('patients')
        .select('*')
        .eq('organization_id', organizationId);

      // Search by name or ID number
      const searchLower = searchTerm.toLowerCase();
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,id_number.ilike.%${searchTerm}%`
      );

      const { data, error } = await query.order('created_at', { ascending: false }).limit(10);

      if (error) {
        console.error('Error searching patients:', error);
        toast.error('Failed to search patients');
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search patients');
    } finally {
      setIsSearching(false);
    }
  };

  const linkDocumentToPatient = async (patient: DatabasePatient) => {
    setIsLinking(true);
    try {
      console.log('🔗 Linking document to patient:', {
        documentId: document.id,
        patientId: patient.id,
        patientName: `${patient.first_name} ${patient.last_name}`
      });

      const { error } = await supabase
        .from('documents')
        .update({ 
          owner_id: patient.id,
          status: document.status === 'pending' ? 'processed' : document.status
        })
        .eq('id', document.id);

      if (error) {
        console.error('❌ Error linking document to patient:', error);
        toast.error(`Failed to link document: ${error.message}`);
        return;
      }

      console.log('✅ Document successfully linked to patient');
      toast.success(`Document linked to ${patient.first_name} ${patient.last_name}`);
      
      onClose();
      if (onLinked) {
        onLinked();
      }
    } catch (error) {
      console.error('❌ Error in linkDocumentToPatient:', error);
      toast.error('Failed to link document to patient');
    } finally {
      setIsLinking(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      searchPatients();
    } else {
      setSearchResults([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Document to Patient
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="patient-search">Search Patients</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="patient-search"
                placeholder="Search by name or ID number..."
                value={searchTerm}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching patients...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Select Patient:</Label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => linkDocumentToPatient(patient)}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </p>
                        {patient.id_number && (
                          <p className="text-sm text-gray-500">ID: {patient.id_number}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          DOB: {patient.date_of_birth}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500">No patients found matching "{searchTerm}"</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLinking}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkToPatientDialog;
