import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import { PatientInfo, ContactInfo } from '@/types/patient';
import { useOrganization } from '@/contexts/OrganizationContext';

const PatientEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  
  // Define initial form state with proper typing
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    contact_info: ContactInfo;
    id_number?: string;
    id_number_valid?: boolean;
    birthdate_from_id?: string | null;
    gender_from_id?: string | null;
    citizenship_status?: string | null;
  }>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    contact_info: {
      email: '',
      phone: '',
      address: ''
    },
    id_number: '',
    id_number_valid: false
  });

  // Fetch patient data if editing
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as PatientInfo;
    },
    enabled: !!id,
  });

  // Set form data when patient data is loaded
  useEffect(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        contact_info: patient.contact_info || {
          email: '',
          phone: '',
          address: ''
        },
        id_number: patient.id_number || '',
        id_number_valid: patient.id_number_valid || false,
        birthdate_from_id: patient.birthdate_from_id || null,
        gender_from_id: patient.gender_from_id || null,
        citizenship_status: patient.citizenship_status || null
      });
    }
  }, [patient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [name]: value
      }
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const patientData = {
        ...formData,
        organization_id: organizationId,
      };
      
      if (id) {
        // Update existing patient
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Patient updated",
          description: "Patient information has been updated successfully."
        });
      } else {
        // Create new patient
        const { data, error } = await supabase
          .from('patients')
          .insert([patientData])
          .select();
        
        if (error) throw error;
        
        toast({
          title: "Patient created",
          description: "New patient has been created successfully."
        });
        
        if (data && data.length > 0) {
          navigate(`/patients/${data[0].id}`);
          return;
        }
      }
      
      navigate('/patients');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving patient information.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate('/patients')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Patients
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit Patient' : 'Create Patient'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                type="text"
                id="firstName"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                type="text"
                id="lastName"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                type="date"
                id="dateOfBirth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => handleSelectChange('gender', value)} defaultValue={formData.gender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.contact_info.email || ''}
                onChange={handleContactInfoChange}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.contact_info.phone || ''}
                onChange={handleContactInfoChange}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.contact_info.address || ''}
                onChange={handleContactInfoChange}
              />
            </div>
            <div>
              <Label htmlFor="id_number">ID Number</Label>
              <Input
                type="text"
                id="id_number"
                name="id_number"
                value={formData.id_number || ''}
                onChange={handleChange}
              />
            </div>
            <Button type="submit">{id ? 'Update Patient' : 'Create Patient'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientEditPage;
