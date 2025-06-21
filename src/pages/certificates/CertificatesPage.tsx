
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackage } from '@/contexts/PackageContext';
import CertificatesFeatureGate from '@/components/certificates/CertificatesFeatureGate';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { FileText, Download, Palette, Zap, Settings } from 'lucide-react';

const CertificatesPage: React.FC = () => {
  const { currentTier, colors, displayName, isPremium, isEnterprise } = usePackage();

  const basicCertificates = [
    {
      title: 'Standard Certificates',
      description: 'Generate basic health certificates',
      icon: FileText,
      available: true
    },
    {
      title: 'Certificate History',
      description: 'View and download past certificates',
      icon: Download,
      available: true
    }
  ];

  const premiumCertificates = [
    {
      title: 'Custom Templates',
      description: 'Create and manage branded certificate templates',
      icon: Palette,
      feature: 'custom_branding' as const
    },
    {
      title: 'Automated Generation',
      description: 'Automatically generate certificates based on results',
      icon: Zap,
      feature: 'automated_scheduling' as const
    }
  ];

  const enterpriseCertificates = [
    {
      title: 'White-Label Certificates',
      description: 'Fully customized certificates with your branding',
      icon: Settings,
      feature: 'white_label_reports' as const
    },
    {
      title: 'API Certificate Generation',
      description: 'Generate certificates programmatically via API',
      icon: Zap,
      feature: 'api_access' as const
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${colors.text}`}>Certificates</h1>
          <p className="text-muted-foreground">
            Manage and generate health certificates for your organization
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
          <TabsTrigger value="basic">Basic Certificates</TabsTrigger>
          <TabsTrigger value="premium">Premium Certificates</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise Certificates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basicCertificates.map((cert) => {
              const IconComponent = cert.icon;
              return (
                <Card key={cert.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="h-5 w-5" />
                      {cert.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {cert.description}
                    </p>
                    <Button className="w-full">
                      Manage Certificates
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
              title="Unlock Premium Certificates"
              description="Access custom templates and automated generation"
              variant="banner"
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumCertificates.map((cert) => {
              const IconComponent = cert.icon;
              return (
                <CertificatesFeatureGate 
                  key={cert.title}
                  feature={cert.feature}
                  title={`${cert.title} - Premium Required`}
                  description="This advanced certificate feature requires a Premium subscription"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {cert.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {cert.description}
                      </p>
                      <Button className="w-full">
                        Access Premium Feature
                      </Button>
                    </CardContent>
                  </Card>
                </CertificatesFeatureGate>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="enterprise" className="space-y-4">
          {!isEnterprise && (
            <UpgradePromptCard
              targetTier="enterprise"
              title="Unlock Enterprise Certificates"
              description="Access white-label certificates and API generation"
              variant="banner"
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enterpriseCertificates.map((cert) => {
              const IconComponent = cert.icon;
              return (
                <CertificatesFeatureGate 
                  key={cert.title}
                  feature={cert.feature}
                  requiredTier="enterprise"
                  title={`${cert.title} - Enterprise Required`}
                  description="This advanced certificate feature requires an Enterprise subscription"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {cert.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {cert.description}
                      </p>
                      <Button className="w-full">
                        Access Enterprise Feature
                      </Button>
                    </CardContent>
                  </Card>
                </CertificatesFeatureGate>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CertificatesPage;
