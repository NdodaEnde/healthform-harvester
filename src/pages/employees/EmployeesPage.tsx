
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackage } from '@/contexts/PackageContext';
import EmployeesFeatureGate from '@/components/employees/EmployeesFeatureGate';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { Users, UserPlus, BarChart3, Settings, Zap, Building2 } from 'lucide-react';

const EmployeesPage: React.FC = () => {
  const { currentTier, colors, displayName, isPremium, isEnterprise } = usePackage();

  const basicEmployees = [
    {
      title: 'Employee Roster',
      description: 'View and manage your employee list',
      icon: Users,
      available: true
    },
    {
      title: 'Add Employees',
      description: 'Register new employees in the system',
      icon: UserPlus,
      available: true
    }
  ];

  const premiumEmployees = [
    {
      title: 'Advanced Profiles',
      description: 'Detailed employee profiles with health analytics',
      icon: BarChart3,
      feature: 'department_breakdowns' as const
    },
    {
      title: 'Batch Operations',
      description: 'Perform bulk operations on multiple employees',
      icon: Settings,
      feature: 'advanced_reporting' as const
    }
  ];

  const enterpriseEmployees = [
    {
      title: 'Department Management',
      description: 'Organize employees across multiple departments',
      icon: Building2,
      feature: 'competitive_benchmarking' as const
    },
    {
      title: 'Employee API',
      description: 'Programmatic access to employee data',
      icon: Zap,
      feature: 'api_access' as const
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${colors.text}`}>Employee Management</h1>
          <p className="text-muted-foreground">
            Manage your workforce and track employee health status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${colors.background} ${colors.text}`}>
            {displayName}
          </span>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className={`${colors.background}`}>
          <TabsTrigger value="basic">Basic Management</TabsTrigger>
          <TabsTrigger value="premium">Premium Features</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise Features</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basicEmployees.map((employee) => {
              const IconComponent = employee.icon;
              return (
                <Card key={employee.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="h-5 w-5" />
                      {employee.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {employee.description}
                    </p>
                    <Button className="w-full">
                      Manage Employees
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Tab

sContent>
        
        <TabsContent value="premium" className="space-y-4">
          {!isPremium && !isEnterprise && (
            <UpgradePromptCard
              targetTier="premium"
              title="Unlock Premium Employee Features"
              description="Access advanced profiles and batch operations"
              variant="banner"
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumEmployees.map((employee) => {
              const IconComponent = employee.icon;
              return (
                <EmployeesFeatureGate 
                  key={employee.title}
                  feature={employee.feature}
                  title={`${employee.title} - Premium Required`}
                  description="This advanced employee feature requires a Premium subscription"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {employee.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {employee.description}
                      </p>
                      <Button className="w-full">
                        Access Premium Feature
                      </Button>
                    </CardContent>
                  </Card>
                </EmployeesFeatureGate>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="enterprise" className="space-y-4">
          {!isEnterprise && (
            <UpgradePromptCard
              targetTier="enterprise"
              title="Unlock Enterprise Employee Features"
              description="Access department management and API integration"
              variant="banner"
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enterpriseEmployees.map((employee) => {
              const IconComponent = employee.icon;
              return (
                <EmployeesFeatureGate 
                  key={employee.title}
                  feature={employee.feature}
                  requiredTier="enterprise"
                  title={`${employee.title} - Enterprise Required`}
                  description="This advanced employee feature requires an Enterprise subscription"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {employee.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {employee.description}
                      </p>
                      <Button className="w-full">
                        Access Enterprise Feature
                      </Button>
                    </CardContent>
                  </Card>
                </EmployeesFeatureGate>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeesPage;
