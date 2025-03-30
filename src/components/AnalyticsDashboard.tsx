
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from './ui/badge';
import { Calendar, FileText, Users, AlertCircle } from 'lucide-react';

const AnalyticsDashboard = () => {
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;
  const isServiceProvider = currentOrganization?.organization_type === 'service_provider';

  // Query to fetch document statistics
  const { data: documentStats, isLoading: loadingDocuments } = useQuery({
    queryKey: ['document-statistics', organizationId],
    queryFn: async () => {
      // Get all documents for this organization
      const { data, error } = await supabase
        .from('documents')
        .select('status, document_type, created_at')
        .eq('organization_id', organizationId);
        
      if (error) throw error;
      
      // Calculate document stats
      const total = data.length;
      const processed = data.filter(doc => doc.status === 'processed').length;
      const pending = data.filter(doc => doc.status === 'pending').length;
      const error_count = data.filter(doc => doc.status === 'error').length;
      
      // Group by document type
      const typeCount = data.reduce((acc: Record<string, number>, doc) => {
        const type = doc.document_type || 'unclassified';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      // Group by month
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      
      const monthlyData = [];
      for (let i = 0; i < 6; i++) {
        const month = new Date(sixMonthsAgo);
        month.setMonth(sixMonthsAgo.getMonth() + i);
        const monthName = month.toLocaleString('default', { month: 'short' });
        const year = month.getFullYear();
        const monthStart = new Date(year, month.getMonth(), 1).toISOString();
        const monthEnd = new Date(year, month.getMonth() + 1, 0).toISOString();
        
        const monthCount = data.filter(
          doc => doc.created_at >= monthStart && doc.created_at <= monthEnd
        ).length;
        
        monthlyData.push({
          name: monthName,
          count: monthCount
        });
      }
      
      return {
        total,
        processed,
        pending,
        error_count,
        typeCount,
        monthlyData,
        processingRate: total > 0 ? Math.round((processed / total) * 100) : 0
      };
    },
    enabled: !!organizationId,
  });

  // Query to fetch patient statistics
  const { data: patientStats, isLoading: loadingPatients } = useQuery({
    queryKey: ['patient-statistics', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, created_at')
        .eq('organization_id', organizationId);
        
      if (error) throw error;
      
      return {
        totalPatients: data.length
      };
    },
    enabled: !!organizationId,
  });

  // For service providers, get client organization count
  const { data: clientStats, isLoading: loadingClients } = useQuery({
    queryKey: ['client-statistics', organizationId],
    queryFn: async () => {
      if (!isServiceProvider) return { totalClients: 0 };
      
      const { data, error } = await supabase
        .from('organization_relationships')
        .select('client_id')
        .eq('service_provider_id', organizationId);
        
      if (error) throw error;
      
      return {
        totalClients: data.length
      };
    },
    enabled: !!organizationId && isServiceProvider,
  });

  // Loading state
  const isLoading = loadingDocuments || loadingPatients || loadingClients;

  // Generate chart data for document types
  const generateDocumentTypeData = () => {
    if (!documentStats?.typeCount) return [];
    
    return Object.entries(documentStats.typeCount).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count
    }));
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Document count card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : documentStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {documentStats?.processed || 0} processed
            </p>
          </CardContent>
        </Card>

        {/* Processing rate card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Processing Success Rate
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `${documentStats?.processingRate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {documentStats?.error_count || 0} errors
            </p>
          </CardContent>
        </Card>

        {/* Patients card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : patientStats?.totalPatients || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All registered patients
            </p>
          </CardContent>
        </Card>

        {/* Clients card (only for service providers) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isServiceProvider ? "Client Organizations" : "Last 30 Days Activity"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading 
                ? "..." 
                : isServiceProvider 
                  ? clientStats?.totalClients || 0
                  : "Coming soon"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {isServiceProvider 
                ? "Connected clients" 
                : "Activity tracking in development"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents">Document Analytics</TabsTrigger>
          <TabsTrigger value="types">Document Types</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-4">Document Submissions Over Time</h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={documentStats?.monthlyData || []}
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
                <Bar dataKey="count" fill="#8884d8" name="Documents" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </TabsContent>
        <TabsContent value="types" className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-4">Document Types Distribution</h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : documentStats && Object.keys(documentStats.typeCount || {}).length > 0 ? (
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generateDocumentTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateDocumentTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 mt-4 lg:mt-0">
                <div className="space-y-2">
                  {generateDocumentTypeData().map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-4 h-4 mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No document type data available
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Document Processing Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-4 py-2 bg-green-50">
                Processed: {documentStats?.processed || 0}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 bg-yellow-50">
                Pending: {documentStats?.pending || 0}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 bg-red-50">
                Error: {documentStats?.error_count || 0}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
