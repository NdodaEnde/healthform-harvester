
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Search, Download, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const EmployeeRoster = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch employee roster with current status
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employee-roster', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          first_name,
          last_name,
          id_number,
          medical_examinations!inner(
            fitness_status,
            examination_date,
            expiry_date,
            company_name
          )
        `)
        .eq('client_organization_id', organizationId)
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Process employee data to get current status
  const processedEmployees = React.useMemo(() => {
    if (!employeeData) return [];

    return employeeData.map(employee => {
      // Get the most recent examination
      const examinations = employee.medical_examinations || [];
      const latestExam = examinations.sort((a, b) => 
        new Date(b.examination_date).getTime() - new Date(a.examination_date).getTime()
      )[0];

      const now = new Date();
      const isExpired = latestExam?.expiry_date ? new Date(latestExam.expiry_date) < now : false;
      const daysToExpiry = latestExam?.expiry_date ? 
        Math.ceil((new Date(latestExam.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      let statusBadge = 'Unknown';
      let statusColor = 'secondary';

      if (latestExam) {
        if (isExpired) {
          statusBadge = 'Expired';
          statusColor = 'destructive';
        } else if (daysToExpiry && daysToExpiry <= 30) {
          statusBadge = 'Expiring Soon';
          statusColor = 'outline';
        } else {
          statusBadge = latestExam.fitness_status || 'Unknown';
          statusColor = latestExam.fitness_status === 'Fit' ? 'default' : 
                       latestExam.fitness_status === 'Fit with Restrictions' ? 'outline' : 'destructive';
        }
      }

      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        idNumber: employee.id_number,
        currentStatus: statusBadge,
        statusColor,
        company: latestExam?.company_name || 'N/A',
        lastExamDate: latestExam?.examination_date,
        expiryDate: latestExam?.expiry_date,
        daysToExpiry,
        isExpired
      };
    });
  }, [employeeData]);

  // Filter employees based on search term
  const filteredEmployees = processedEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateRosterReport = () => {
    if (processedEmployees.length === 0) {
      toast.error('No employee data available for export');
      return;
    }

    const reportData = processedEmployees.map(emp => ({
      'Employee Name': emp.name,
      'ID Number': emp.idNumber || 'N/A',
      'Company': emp.company,
      'Current Status': emp.currentStatus,
      'Last Exam Date': emp.lastExamDate ? new Date(emp.lastExamDate).toLocaleDateString() : 'N/A',
      'Certificate Expiry': emp.expiryDate ? new Date(emp.expiryDate).toLocaleDateString() : 'N/A',
      'Days to Expiry': emp.daysToExpiry !== null ? emp.daysToExpiry.toString() : 'N/A'
    }));

    // Convert to CSV
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Employee_Roster_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Employee roster exported successfully!');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = processedEmployees.reduce((acc, emp) => {
    acc[emp.currentStatus] = (acc[emp.currentStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedEmployees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fit for Duty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts['Fit'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Restrictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts['Fit with Restrictions'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired/Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts['Expired'] || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Roster Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Roster with Current Status
            </CardTitle>
            <Button onClick={generateRosterReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees, ID numbers, or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {employee.idNumber || 'N/A'} • {employee.company}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        {employee.lastExamDate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(employee.lastExamDate).toLocaleDateString()}
                          </div>
                        )}
                        {employee.expiryDate && (
                          <div className="text-xs">
                            Expires: {new Date(employee.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <Badge variant={employee.statusColor as any}>
                        {employee.currentStatus}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No employees found matching your search' : 'No employee data available'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeRoster;
