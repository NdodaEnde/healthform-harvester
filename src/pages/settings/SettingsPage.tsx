
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackage } from '@/contexts/PackageContext';
import FeatureFlagManager from '@/components/compound-documents/FeatureFlagManager';
import { Settings, Palette, Users, Shield, Zap, Flag } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { currentTier, colors, displayName } = usePackage();

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
          <TabsTrigger value="features">Features</TabsTrigger>
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
        
        <TabsContent value="features" className="space-y-4">
          <FeatureFlagManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
