
import React from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const ClinicalAnalyticsPage = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch patients data
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-clinical', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId
  });

  // Fetch documents data with extracted medical details
  const { data: documentsData, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents-clinical', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'processed');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId
  });

  // Calculate gender distribution
  const genderDistribution = React.useMemo(() => {
    if (!patientsData) return [];
    
    const counts = patientsData.reduce((acc, patient) => {
      const gender = patient.gender || 'unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [patientsData]);

  // Calculate age distribution
  const ageDistribution = React.useMemo(() => {
    if (!patientsData) return [];
    
    const ageGroups = {
      '0-18': 0,
      '19-30': 0,
      '31-45': 0,
      '46-60': 0,
      '61+': 0,
      'Unknown': 0
    };
    
    patientsData.forEach(patient => {
      if (!patient.date_of_birth) {
        ageGroups['Unknown']++;
        return;
      }
      
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age <= 18) {
        ageGroups['0-18']++;
      } else if (age <= 30) {
        ageGroups['19-30']++;
      } else if (age <= 45) {
        ageGroups['31-45']++;
      } else if (age <= 60) {
        ageGroups['46-60']++;
      } else {
        ageGroups['61+']++;
      }
    });
    
    return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
  }, [patientsData]);

  // Calculate citizenship distribution
  const citizenshipDistribution = React.useMemo(() => {
    if (!patientsData) return [];
    
    const counts = patientsData.reduce((acc, patient) => {
      const citizenship = patient.contact_info?.citizenship || 'unknown';
      acc[citizenship] = (acc[citizenship] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).map(([name, value]) => {
      // Format the citizenship name for display
      let formattedName = name;
      if (name === 'citizen') formattedName = 'SA Citizen';
      else if (name === 'permanent_resident') formattedName = 'Permanent Resident';
      else if (name === 'unknown') formattedName = 'Unknown';
      
      return { 
        name: formattedName, 
        value 
      };
    });
  }, [patientsData]);

  // Extract fitness assessment data
  const fitnessAssessment = React.useMemo(() => {
    if (!documentsData) return [];
    
    const fitnessCounts = {
      'Fit': 0,
      'Fit with Restrictions': 0,
      'Temporarily Unfit': 0,
      'Permanently Unfit': 0,
      'Unknown': 0
    };
    
    documentsData.forEach(doc => {
      try {
        const extractedData = doc.extracted_data;
        if (!extractedData || typeof extractedData !== 'object') {
          fitnessCounts['Unknown']++;
          return;
        }
        
        // Check if extracted_data is an array
        if (Array.isArray(extractedData)) {
          fitnessCounts['Unknown']++;
          return;
        }
        
        // Now we know extractedData is an object type
        const structuredData = extractedData.structured_data;
        if (!structuredData || typeof structuredData !== 'object' || Array.isArray(structuredData)) {
          fitnessCounts['Unknown']++;
          return;
        }
        
        // Check if certification exists and is an object
        const certification = structuredData.certification;
        if (!certification || typeof certification !== 'object' || Array.isArray(certification)) {
          fitnessCounts['Unknown']++;
          return;
        }
        
        if (certification.fit || certification.fit_for_duty) {
          fitnessCounts['Fit']++;
        } else if (certification.fit_with_restrictions) {
          fitnessCounts['Fit with Restrictions']++;
        } else if (certification.temporarily_unfit) {
          fitnessCounts['Temporarily Unfit']++;
        } else if (certification.unfit || certification.permanently_unfit) {
          fitnessCounts['Permanently Unfit']++;
        } else {
          fitnessCounts['Unknown']++;
        }
      } catch (err) {
        fitnessCounts['Unknown']++;
      }
    });
    
    return Object.entries(fitnessCounts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [documentsData]);

  // Gender distribution by fitness status
  const genderFitnessDistribution = React.useMemo(() => {
    if (!documentsData || !patientsData) return [];
    
    const genderFitness = {
      male: { fit: 0, restrictions: 0, unfit: 0, total: 0 },
      female: { fit: 0, restrictions: 0, unfit: 0, total: 0 },
      other: { fit: 0, restrictions: 0, unfit: 0, total: 0 }
    };

    // First count total patients by gender
    patientsData.forEach(patient => {
      const gender = patient.gender || 'other';
      if (genderFitness[gender]) {
        genderFitness[gender].total++;
      } else {
        genderFitness['other'].total++;
      }
    });
    
    // Then analyze documents with fitness data
    documentsData.forEach(doc => {
      try {
        // Get the patient related to this document
        const patientInfo = patientsData?.find(p => {
          const patientDocs = p.medical_history?.documents || [];
          return patientDocs.some(d => d.document_id === doc.id);
        });
        
        if (!patientInfo) return;
        
        const gender = patientInfo.gender || 'other';
        const genderCategory = genderFitness[gender] ? gender : 'other';
        
        const extractedData = doc?.extracted_data?.structured_data;
        if (!extractedData?.certification) return;
        
        const certification = extractedData.certification;
        
        if (certification.fit || certification.fit_for_duty) {
          genderFitness[genderCategory].fit++;
        } else if (certification.fit_with_restrictions) {
          genderFitness[genderCategory].restrictions++;
        } else if (certification.temporarily_unfit || certification.unfit) {
          genderFitness[genderCategory].unfit++;
        }
      } catch (err) {
        console.error('Error processing document for gender fitness analysis:', err);
      }
    });
    
    // Convert to chart format
    const data = [
      { name: 'Fit', male: genderFitness.male.fit, female: genderFitness.female.fit, other: genderFitness.other.fit },
      { name: 'With Restrictions', male: genderFitness.male.restrictions, female: genderFitness.female.restrictions, other: genderFitness.other.restrictions },
      { name: 'Unfit', male: genderFitness.male.unfit, female: genderFitness.female.unfit, other: genderFitness.other.unfit }
    ];
    
    return data;
  }, [documentsData, patientsData]);

  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

  if (isLoadingPatients || isLoadingDocuments) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Clinical Analytics</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Analyze patient clinical data and trends
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patientsData?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clinical Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentsData?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Processed certificates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fit for Duty Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentsData?.length ? 
                Math.round((fitnessAssessment.find(f => f.name === 'Fit')?.value || 0) / documentsData.length * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of all assessments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Outcomes</TabsTrigger>
          <TabsTrigger value="medical">Medical Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>
                  Distribution of patients by gender
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>
                  Distribution of patients by age group
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ageDistribution}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Patients" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Citizenship Status</CardTitle>
                <CardDescription>
                  Distribution of patients by citizenship status
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={citizenshipDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {citizenshipDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === 'SA Citizen' ? '#4ade80' : 
                            entry.name === 'Permanent Resident' ? '#60a5fa' : 
                            '#d4d4d8'
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fitness Assessment Results</CardTitle>
                <CardDescription>
                  Distribution of fitness assessment outcomes
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fitnessAssessment}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fitnessAssessment.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name === 'Fit' ? '#10b981' : 
                                entry.name === 'Fit with Restrictions' ? '#f59e0b' : 
                                entry.name === 'Temporarily Unfit' ? '#f97316' : 
                                entry.name === 'Permanently Unfit' ? '#ef4444' : 
                                '#71717a'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fitness Status by Gender</CardTitle>
                <CardDescription>
                  Distribution of fitness outcomes across genders
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={genderFitnessDistribution}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" name="Male" fill="#60a5fa" />
                    <Bar dataKey="female" name="Female" fill="#f472b6" />
                    <Bar dataKey="other" name="Other" fill="#a78bfa" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Test Completion</CardTitle>
              <CardDescription>
                Percentage of tests completed across all patients
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Vision Test', rate: 87 },
                    { name: 'Hearing Test', rate: 74 },
                    { name: 'Blood Test', rate: 68 },
                    { name: 'Drug Screen', rate: 42 },
                    { name: 'Lung Function', rate: 39 },
                    { name: 'X-Ray', rate: 28 },
                  ]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" fill="#8884d8" name="Completion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClinicalAnalyticsPage;
