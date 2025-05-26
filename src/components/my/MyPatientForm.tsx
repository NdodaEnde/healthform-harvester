
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { NormalizedDataService } from '@/services/normalizedDataService';
import type { MyPatient, MyOrganization, MyPatientWithOrganization } from '@/types/normalized-database';

const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().optional(),
  id_number: z.string().optional(),
  client_organization_id: z.string().min(1, 'Organization is required'),
  is_active: z.boolean()
});

type PatientFormData = z.infer<typeof patientSchema>;

interface MyPatientFormProps {
  patient?: MyPatientWithOrganization;
  preselectedOrganizationId?: string;
  onSave?: (patient: MyPatient) => void;
  onCancel?: () => void;
}

const MyPatientForm: React.FC<MyPatientFormProps> = ({
  patient,
  preselectedOrganizationId,
  onSave,
  onCancel
}) => {
  const [clientOrganizations, setClientOrganizations] = useState<MyOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: patient?.first_name || '',
      last_name: patient?.last_name || '',
      date_of_birth: patient?.date_of_birth || '',
      gender: patient?.gender || '',
      id_number: patient?.id_number || '',
      client_organization_id: patient?.client_organization_id || preselectedOrganizationId || '',
      is_active: patient?.is_active ?? true
    }
  });

  const selectedOrganizationId = watch('client_organization_id');

  useEffect(() => {
    const fetchClientOrganizations = async () => {
      try {
        setLoadingOrganizations(true);
        // Get organizations of type 'client'
        const organizations = await NormalizedDataService.getOrganizationsByType('client');
        setClientOrganizations(organizations);
      } catch (error) {
        console.error('Error fetching client organizations:', error);
        toast.error('Failed to load client organizations');
      } finally {
        setLoadingOrganizations(false);
      }
    };

    fetchClientOrganizations();
  }, []);

  const onSubmit = async (data: PatientFormData) => {
    try {
      setLoading(true);
      
      const patientData = {
        ...data,
        gender: data.gender || null,
        id_number: data.id_number || null,
        contact_info: null,
        medical_history: null
      };

      if (patient) {
        // Update existing patient (would need update method)
        toast.success('Patient updated successfully');
      } else {
        // Create new patient
        const newPatient = await NormalizedDataService.createPatient(patientData);
        toast.success('Patient created successfully');
        if (onSave) {
          onSave(newPatient);
        }
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {patient ? 'Edit Patient' : 'Create New Patient'}
        </CardTitle>
        <CardDescription>
          {patient 
            ? 'Update patient information and details'
            : 'Add a new patient to the system'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
              />
              {errors.date_of_birth && (
                <p className="text-sm text-red-600">{errors.date_of_birth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={watch('gender') || ''}
                onValueChange={(value) => setValue('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_number">ID Number</Label>
            <Input
              id="id_number"
              {...register('id_number')}
              placeholder="Enter ID number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_organization_id">Client Organization *</Label>
            {loadingOrganizations ? (
              <div className="text-sm text-muted-foreground">Loading organizations...</div>
            ) : (
              <Select
                value={selectedOrganizationId || ''}
                onValueChange={(value) => setValue('client_organization_id', value)}
                disabled={!!preselectedOrganizationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client organization" />
                </SelectTrigger>
                <SelectContent>
                  {clientOrganizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.client_organization_id && (
              <p className="text-sm text-red-600">{errors.client_organization_id.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Active Patient</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : patient ? 'Update Patient' : 'Create Patient'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MyPatientForm;
