
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  User, 
  Building, 
  Bell,
  Shield,
  Zap,
  TestTube
} from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureFlagManager } from "@/components/compound-documents";
import FeatureFlagTestingPanel from "@/components/compound-documents/FeatureFlagTestingPanel";

const Settings = () => {
  const { isFeatureEnabled } = useFeatureFlags();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, organization, and system preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Features
            <Badge variant="outline" className="ml-1">Beta</Badge>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
            <Badge variant="outline" className="ml-1">Dev</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">General application settings will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">User profile settings will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Organization management settings will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Notification settings will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Feature Management
                  <Badge variant="outline">Beta Testing</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage beta features and experimental functionality. These settings are for testing purposes and may affect system behavior.
                </p>
              </CardContent>
            </Card>

            {isFeatureEnabled('compound_documents_enabled') && (
              <FeatureFlagManager />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Feature Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Some features may require specific subscription tiers or organizational permissions. 
                  Contact your administrator for access to premium features.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing">
          <div className="space-y-6">
            <FeatureFlagTestingPanel />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Development Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  This section contains development and testing tools. Use with caution in production environments.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
