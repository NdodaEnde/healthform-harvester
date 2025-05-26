
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

const clientSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddClientForm: React.FC<AddClientFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema)
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      setLoading(true);
      
      if (!currentOrganization?.id) {
        toast.error('No organization selected');
        return;
      }

      // First create the client organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          organization_type: 'client',
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          is_active: true
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Then create the relationship
      const { error: relError } = await supabase
        .from('organization_relationships')
        .insert({
          service_provider_id: currentOrganization.id,
          client_id: newOrg.id,
          relationship_start_date: new Date().toISOString().split('T')[0],
          is_active: true
        });

      if (relError) throw relError;

      toast.success('Client organization created successfully');
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Client Organization</CardTitle>
        <CardDescription>
          Create a new client organization and establish a relationship
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Client'}
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

export default AddClientForm;
