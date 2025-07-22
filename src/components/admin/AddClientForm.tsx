
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
import { Loader2 } from 'lucide-react';

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

      console.log('Creating client organization with data:', {
        org_name: data.name,
        org_email: data.contact_email || null,
        service_provider_id: currentOrganization.id
      });

      // Use the RPC function to create client organization
      const { data: result, error } = await supabase.rpc('create_client_organization', {
        org_name: data.name,
        org_email: data.contact_email || null,
        service_provider_id: currentOrganization.id
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      console.log('Client organization created successfully:', result);

      toast.success('Client organization created successfully');
      reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error creating client:', error);
      
      // Handle specific error messages from the RPC function
      let errorMessage = 'Failed to create client organization';
      
      if (error.message) {
        if (error.message.includes('already exists')) {
          errorMessage = 'An organization with this name already exists';
        } else if (error.message.includes('Organization name cannot be empty')) {
          errorMessage = 'Organization name is required';
        } else if (error.message.includes('Failed to create organization')) {
          errorMessage = error.message.replace('Failed to create organization: ', '');
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Client'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
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
