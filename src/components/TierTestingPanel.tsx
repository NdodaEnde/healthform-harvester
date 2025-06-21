
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier, FeatureKey } from '@/types/subscription';
import { TestTube, Zap, Crown, Lock, Check, X } from 'lucide-react';

const TierTestingPanel: React.FC = () => {
  const { 
    currentTier, 
    hasFeature, 
    canAccessFeature, 
    upgradePackage, 
    displayName,
    colors,
    isBasic,
    isPremium,
    isEnterprise
  } = usePackage();
  
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const testFeatures: FeatureKey[] = [
    'employee_status_overview',
    'compliance_tracking',
    'basic_reporting',
    'trend_analysis',
    'risk_intelligence',
    'advanced_reporting',
    'department_breakdowns',
    'custom_branding',
    'competitive_benchmarking',
    'api_access',
    'white_label_reports'
  ];

  const testTierAccess = (tier: PackageTier) => {
    const result = canAccessFeature(tier);
    setTestResults(prev => ({ ...prev, [`tier_${tier}`]: result }));
    return result;
  };

  const testFeatureAccess = (feature: FeatureKey) => {
    const result = hasFeature(feature);
    setTestResults(prev => ({ ...prev, [`feature_${feature}`]: result }));
    return result;
  };

  const simulateUpgrade = async (newTier: PackageTier) => {
    const success = await upgradePackage(newTier);
    if (success) {
      setTimeout(() => window.location.reload(), 500);
    }
    return success;
  };

  const runAllTests = () => {
    console.log('Running comprehensive tier tests...');
    
    // Test tier access
    ['basic', 'premium', 'enterprise'].forEach(tier => {
      testTierAccess(tier as PackageTier);
    });
    
    // Test feature access
    testFeatures.forEach(feature => {
      testFeatureAccess(feature);
    });
    
    console.log('Test results:', testResults);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Tier-Based System Testing Panel
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${colors.background} ${colors.text}`}>
            Current: {displayName}
          </Badge>
          <Badge variant={isBasic ? 'secondary' : isPremium ? 'default' : 'outline'}>
            {currentTier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Feature Tests</TabsTrigger>
            <TabsTrigger value="tiers">Tier Tests</TabsTrigger>
            <TabsTrigger value="simulation">Upgrade Simulation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Basic Access</span>
                    {isBasic ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Premium Access</span>
                    {isPremium || isEnterprise ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enterprise Access</span>
                    {isEnterprise ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button onClick={runAllTests} className="w-full">
              Run All Tests
            </Button>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {testFeatures.map(feature => {
                const hasAccess = hasFeature(feature);
                return (
                  <div key={feature} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-mono">{feature}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testFeatureAccess(feature)}
                      className="ml-2"
                    >
                      {hasAccess ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="tiers" className="space-y-4">
            <div className="space-y-2">
              {(['basic', 'premium', 'enterprise'] as PackageTier[]).map(tier => {
                const hasAccess = canAccessFeature(tier);
                const tierIcons = { basic: Lock, premium: Zap, enterprise: Crown };
                const TierIcon = tierIcons[tier];
                
                return (
                  <div key={tier} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <TierIcon className="h-4 w-4" />
                      <span className="font-medium capitalize">{tier}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testTierAccess(tier)}
                    >
                      {hasAccess ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="simulation" className="space-y-4">
            <div className="space-y-2">
              {(['basic', 'premium', 'enterprise'] as PackageTier[]).map(tier => {
                if (tier === currentTier) return null;
                
                return (
                  <Button
                    key={tier}
                    variant="outline"
                    onClick={() => simulateUpgrade(tier)}
                    className="w-full justify-start"
                  >
                    Simulate Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </Button>
                );
              })}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>* Simulation will temporarily change your tier for testing purposes.</p>
              <p>* Page will reload to reflect changes.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TierTestingPanel;
