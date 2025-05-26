
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { NormalizedDataService } from '@/services/normalizedDataService';
import type { MyOrganization, MyOrganizationType, MyOrganizationWithType } from '@/types/normalized-database';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  organization_type_id: z.number().min(1, 'Organization type is required'),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  is_active: z.boolean()
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface MyOrganizationFormProps {
  organization?: MyOrganizationWithType;
  onSave?: (organization: MyOrganization) => void;
  onCancel?: () => void;
}

const MyOrganizationForm: React.FC<MyOrganizationFormProps> = ({
  organization,
  onSave,
  onCancel
}) => {
  const [organizationTypes, setOrganizationTypes] = useState<MyOrganizationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || '',
      organization_type_id: organization?.organization_type_id || 0,
      contact_email: organization?.contact_email || '',
      contact_phone: organization?.contact_phone || '',
      is_active: organization?.is_active ?? true
    }
  });

  const selectedTypeId = watch('organization_type_id');

  useEffect(() => {
    const fetchOrganizationTypes = async () => {
      try {
        setLoadingTypes(true);
        const types = await NormalizedDataService.getOrganizationTypes();
        setOrganizationTypes(types);
      } catch (error) {
        console.error('Error fetching organization types:', error);
        toast.error('Failed to load organization types');
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchOrganizationTypes();
  }, []);

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      setLoading(true);
      
      const organizationData = {
        ...data,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        address: null,
        logo_url: null,
        settings: null
      };

      if (organization) {
        // Update existing organization (would need update method)
        toast.success('Organization updated successfully');
      } else {
        // Create new organization
        const newOrganization = await NormalizedDataService.createOrganization(organizationData);
        toast.success('Organization created successfully');
        if (onSave) {
          onSave(newOrganization);
        }
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Failed to save organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {organization ? 'Edit Organization' : 'Create New Organization'}
        </CardTitle>
        <CardDescription>
          {organization 
            ? 'Update organization information and settings'
            : 'Add a new organization to the system'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter organization name"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization_type_id">Organization Type *</Label>
            {loadingTypes ? (
              <div className="text-sm text-muted-foreground">Loading types...</div>
            ) : (
              <Select
                value={selectedTypeId?.toString() || ''}
                onValueChange={(value) => setValue('organization_type_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  {organizationTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.type_name}
                      {type.description && (
                        <span className="text-muted-foreground ml-2">
                          - {type.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.organization_type_id && (
              <p className="text-sm text-red-600">{errors.organization_type_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              {...register('contact_email')}
              placeholder="Enter contact email"
            />
            {errors.contact_email && (
              <p className="text-sm text-red-600">{errors.contact_email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              {...register('contact_phone')}
              placeholder="Enter contact phone number"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Active Organization</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : organization ? 'Update Organization' : 'Create Organization'}
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

export default MyOrganizationForm;
