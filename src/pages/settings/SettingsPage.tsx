
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackage } from '@/contexts/PackageContext';
import SettingsFeatureGate from '@/components/settings/SettingsFeatureGate';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { Settings, Palette, Users, Shield, Zap } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { currentTier, colors, displayName, isPremium, isEnterprise } = usePackage();

  const basicSettings = [
    {
      title: 'General Settings',
      description: 'Basic organization settings and preferences',
      icon: Settings,
      available: true
    },
    {
      title: 'User Management',
      description: 'Manage users and basic permissions',
      icon: Users,
      available: true
    }
  ];

  const premiumSettings = [
    {
      title: 'Advanced Branding',
      description: 'Custom logos, colors, and branded reports',
      icon: Palette,
      feature: 'custom_branding' as const
    },
    {
      title: 'Department Management',
      description: 'Organize users into departments and teams',
      icon: Users,
      feature: 'department_breakdowns' as const
    }
  ];

  const enterpriseSettings = [
    {
      title: 'Security & Compliance',
      description: 'Advanced security controls and audit trails',
      icon: Shield,
      feature: 'competitive_benchmarking' as const
    },
    {
      title: 'API & Integrations',
      description: 'Custom integrations and API access',
      icon: Zap,
      feature: 'api_access' as const
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${colors.text}`}>Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization settings and preferences
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
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="premium">Premium Settings</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basicSettings.map((setting) => {
              const IconComponent = setting.icon;
              return (
                <Card key={setting.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="h-5 w-5" />
                      {setting.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                    <Button className="w-full">
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="premium" className="space-y-4">
          {!isPremium && !isEnterprise && (
            <UpgradePromptCard
              targetTier="premium"
              title="Unlock Premium Settings"
              description="Access advanced customization and branding options"
              variant="banner"
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumSettings.map((setting) => {
              const IconComponent = setting.icon;
              return (
                <SettingsFeatureGate 
                  key={setting.title}
                  feature={setting.feature}
                  title={`${setting.title} - Premium Required`}
                  description="This advanced setting requires a Premium subscription"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {setting.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                      <Button className="w-full">
                        Configure Premium Settings
                      </Button>
                    </CardContent>
                  </Card>
                </SettingsFeatureGate>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="enterprise" className="space-y-4">
          {!isEnterprise && (
            <UpgradePromptCard
              targetTier="enterprise"
              title="Unlock Enterprise Settings"
              description="Access advanced security and integration controls"
              variant="banner"
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enterpriseSettings.map((setting) => {
              const IconComponent = setting.icon;
              return (
                <SettingsFeatureGate 
                  key={setting.title}
                  feature={setting.feature}
                  requiredTier="enterprise"
                  title={`${setting.title} - Enterprise Required`}
                  description="This advanced setting requires an Enterprise subscription"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {setting.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                      <Button className="w-full">
                        Configure Enterprise Settings
                      </Button>
                    </CardContent>
                  </Card>
                </SettingsFeatureGate>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
