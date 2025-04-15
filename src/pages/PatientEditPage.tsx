import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, UserCheck } from 'lucide-react';
import { PatientInfo, ContactInfo } from '@/types/patient';
import { processIDNumberForPatient, doesIDNumberNeedProcessing } from '@/utils/id-number-processor';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const PatientEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessingID, setIsProcessingID] = useState(false);

  // Create a form schema based on PatientInfo
  const formSchema = z.object({
    first_name: z.string().min(1, { message: "First name is required" }),
    last_name: z.string().min(1, { message: "Last name is required" }),
    date_of_birth: z.string().optional(),
    gender: z.string().optional(),
    contact_info: z.object({
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional().or(z.literal('')),
      address: z.string().optional().or(z.literal('')),
    }).optional(),
    id_number: z.string().optional().or(z.literal('')),
  });

  // Add types to the form
  type FormValues = z.infer<typeof formSchema>;

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as PatientInfo;
    },
    enabled: !!id,
  });

  // Initialize the form with patient data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      contact_info: {
        email: '',
        phone: '',
        address: '',
      },
      id_number: '',
    },
  });

  // Update form values when patient data is loaded
  useEffect(() => {
    if (patient) {
      form.reset({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        contact_info: {
          email: patient.contact_info?.email || '',
          phone: patient.contact_info?.phone || '',
          address: patient.contact_info?.address || '',
        },
        id_number: patient.id_number || '',
      });
    }
  }, [patient, form]);

  const updatePatient = useMutation({
    mutationFn: async (updatedPatient: Partial<PatientInfo>) => {
      const { data, error } = await supabase
        .from('patients')
        .update(updatedPatient)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient information updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      navigate(`/patients/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update patient: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    
    // Extract form values
    const { first_name, last_name, date_of_birth, gender, contact_info, id_number } = data;
    
    // Prepare the update data
    let updateData: Partial<PatientInfo> = {
      first_name,
      last_name,
      date_of_birth: date_of_birth || null,
      gender,
      contact_info: contact_info || null,
    };

    // Process ID number if changed
    if (id_number && patient && doesIDNumberNeedProcessing(patient, id_number)) {
      setIsProcessingID(true);
      try {
        // Create a temporary patient object for processing
        const tempPatient: PatientInfo = {
          ...patient,
          id_number,
        };
        
        // Process the ID number and extract demographic data
        const processedPatient = processIDNumberForPatient(tempPatient, id_number);
        
        // Add the processed ID data to the update
        updateData.id_number = processedPatient.id_number;
        updateData.id_number_valid = processedPatient.id_number_valid;
        updateData.birthdate_from_id = processedPatient.birthdate_from_id;
        updateData.gender_from_id = processedPatient.gender_from_id;
        updateData.citizenship_status = processedPatient.citizenship_status;
        
        // If date of birth is not set but we got it from ID, use that
        if (!updateData.date_of_birth && processedPatient.birthdate_from_id) {
          updateData.date_of_birth = processedPatient.birthdate_from_id;
        }
        
        // If gender is not set but we got it from ID, use that
        if (!updateData.gender && processedPatient.gender_from_id) {
          updateData.gender = processedPatient.gender_from_id;
        }
      } catch (error) {
        console.error("Error processing ID number:", error);
      } finally {
        setIsProcessingID(false);
      }
    } else if (id_number === '') {
      // Clear ID fields if ID number is removed
      updateData.id_number = null;
      updateData.id_number_valid = false;
      updateData.birthdate_from_id = null;
      updateData.gender_from_id = null;
      updateData.citizenship_status = null;
    }

    // Submit the update
    updatePatient.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Patient</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <Input placeholder="Gender" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_info.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_info.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_info.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>South African ID Number</FormLabel>
                    <FormControl>
                      <Input placeholder="ID Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={updatePatient.isPending || isProcessingID}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {(updatePatient.isPending || isProcessingID) ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default PatientEditPage;
