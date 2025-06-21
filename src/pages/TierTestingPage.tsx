
import React from 'react';
import { usePackage } from '@/contexts/PackageContext';
import TierTestingPanel from '@/components/TierTestingPanel';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, Zap, Crown, Shield } from 'lucide-react';

const TierTestingPage: React.FC = () => {
  const { currentTier, displayName, colors, isBasic, isPremium, isEnterprise } = usePackage();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${colors.text} flex items-center gap-2`}>
            <TestTube className="h-8 w-8" />
            Tier System Testing
          </h1>
          <p className="text-muted-foreground">
            Comprehensive testing environment for the tier-based feature system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${colors.background} ${colors.text}`}>
            {displayName}
          </Badge>
          <Badge variant={isBasic ? 'secondary' : isPremium ? 'default' : 'outline'}>
            {currentTier.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Basic Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isBasic || isPremium || isEnterprise ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              Essential health management
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {isPremium || isEnterprise ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              AI-powered analytics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-600" />
              Enterprise Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {isEnterprise ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              Strategic intelligence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Testing Panel */}
      <TierTestingPanel />

      {/* Upgrade Prompt Examples */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upgrade Prompt Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isPremium && !isEnterprise && (
            <UpgradePromptCard
              targetTier="premium"
              title="Premium Features Demo"
              description="Test the premium upgrade flow"
              variant="card"
            />
          )}
          
          {!isEnterprise && (
            <UpgradePromptCard
              targetTier="enterprise"
              title="Enterprise Features Demo"
              description="Test the enterprise upgrade flow"
              variant="card"
            />
          )}
        </div>

        {/* Banner Examples */}
        {!isEnterprise && (
          <UpgradePromptCard
            targetTier={isPremium ? "enterprise" : "premium"}
            title="Banner Style Upgrade Prompt"
            description="This demonstrates the banner variant"
            variant="banner"
          />
        )}

        {/* Compact Examples */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Compact Variants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {!isPremium && !isEnterprise && (
              <UpgradePromptCard
                targetTier="premium"
                variant="compact"
              />
            )}
            {!isEnterprise && (
              <UpgradePromptCard
                targetTier="enterprise"
                variant="compact"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierTestingPage;
