
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchCertificateTemplates } from '@/services/certificateTemplateService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  email?: string;
  // Add other patient fields as needed
}

interface CertificateGeneratorProps {
  patient: PatientData;
  onClose?: () => void;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ patient, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id || '';
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [fitnessStatement, setFitnessStatement] = useState('Patient is fit for all activities with no restrictions.');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [newRestriction, setNewRestriction] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Query templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['certificate-templates', orgId],
    queryFn: () => fetchCertificateTemplates(orgId),
    enabled: !!orgId,
  });
  
  // Get default template
  React.useEffect(() => {
    if (templates && templates.length > 0) {
      const defaultTemplate = templates.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else {
        setSelectedTemplateId(templates[0].id);
      }
    }
  }, [templates]);
  
  // Handle adding restrictions
  const addRestriction = () => {
    if (newRestriction.trim()) {
      setRestrictions([...restrictions, newRestriction.trim()]);
      setNewRestriction('');
    }
  };
  
  const removeRestriction = (index: number) => {
    setRestrictions(restrictions.filter((_, i) => i !== index));
  };
  
  // Create certificate mutation
  const createCertificateMutation = useMutation({
    mutationFn: async (certificateData: any) => {
      const { data, error } = await supabase
        .from('certificates')
        .insert(certificateData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient-certificates', patient.id] });
      toast({
        title: "Certificate Created",
        description: "Medical certificate has been successfully generated.",
      });
      
      // If patient has an email, suggest sending the certificate
      if (patient.email) {
        if (confirm(`Would you like to email this certificate to ${patient.email}?`)) {
          navigate(`/certificates/${data.id}`);
        }
      }
      
      if (onClose) {
        onClose();
      } else {
        navigate(`/certificates/${data.id}`);
      }
    },
    onError: (error) => {
      console.error("Error creating certificate:", error);
      toast({
        title: "Error",
        description: "Failed to generate certificate. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const generateCertificate = async () => {
    if (!currentOrganization || !patient) return;
    
    setIsGenerating(true);
    
    try {
      const certificateData = {
        template_id: selectedTemplateId || null,
        patient_info: {
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          birthdate: patient.birthdate,
        },
        company_info: {
          name: currentOrganization.name,
          logo_url: currentOrganization.logo_url,
        },
        fitness_declaration: {
          statement: fitnessStatement,
        },
        restrictions: restrictions.length > 0 ? restrictions : null,
        expiration_date: expirationDate ? new Date(expirationDate).toISOString() : null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        organization_id: orgId,
      };
      
      createCertificateMutation.mutate(certificateData);
    } catch (error) {
      console.error("Error in certificate generation:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Medical Certificate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="template" className="block text-sm font-medium mb-1">Certificate Template</label>
            <select
              id="template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={!templates || templates.length === 0}
            >
              {!templates || templates.length === 0 ? (
                <option value="">No templates available</option>
              ) : (
                templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.is_default ? '(Default)' : ''}
                  </option>
                ))
              )}
            </select>
            {(!templates || templates.length === 0) && (
              <p className="text-sm text-amber-600 mt-1">
                No certificate templates found. Consider creating templates in settings.
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="fitnessStatement" className="block text-sm font-medium mb-1">Fitness Declaration</label>
            <textarea
              id="fitnessStatement"
              value={fitnessStatement}
              onChange={(e) => setFitnessStatement(e.target.value)}
              className="w-full p-2 border rounded-md min-h-[100px]"
              placeholder="Enter fitness declaration statement"
            />
          </div>
          
          <div>
            <label htmlFor="restrictions" className="block text-sm font-medium mb-1">Restrictions (if any)</label>
            <div className="flex mb-2">
              <input
                id="restrictions"
                type="text"
                value={newRestriction}
                onChange={(e) => setNewRestriction(e.target.value)}
                className="flex-1 p-2 border rounded-l-md"
                placeholder="Add a restriction"
                onKeyPress={(e) => e.key === 'Enter' && addRestriction()}
              />
              <button
                type="button"
                onClick={addRestriction}
                className="px-4 bg-primary text-white rounded-r-md"
                disabled={!newRestriction.trim()}
              >
                Add
              </button>
            </div>
            {restrictions.length > 0 && (
              <ul className="space-y-1 mt-2">
                {restrictions.map((restriction, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{restriction}</span>
                    <button
                      type="button"
                      onClick={() => removeRestriction(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <label htmlFor="expirationDate" className="block text-sm font-medium mb-1">Expiration Date (optional)</label>
            <input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full p-2 border rounded-md"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button onClick={generateCertificate} disabled={isGenerating || !fitnessStatement.trim()}>
          {isGenerating ? 'Generating...' : 'Generate Certificate'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CertificateGenerator;
