
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import PackageBadge from './PackageBadge';
import { Calendar, Users, Zap } from 'lucide-react';

const SubscriptionStatusWidget: React.FC = () => {
  const { subscription, currentTier, upgradeSubscription } = useSubscription();

  if (!subscription) return null;

  const daysUntilRenewal = subscription.current_period_end 
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isTrialActive = subscription.trial_end && new Date(subscription.trial_end) > new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
        <PackageBadge tier={currentTier} />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isTrialActive && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Free Trial Active</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Trial ends {new Date(subscription.trial_end!).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Renewal in {daysUntilRenewal} days</span>
            </div>
            <span className="text-muted-foreground">
              {subscription.status === 'active' ? 'Active' : subscription.status}
            </span>
          </div>

          {currentTier !== 'enterprise' && (
            <div className="pt-2 border-t">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => upgradeSubscription(currentTier === 'basic' ? 'premium' : 'enterprise')}
              >
                Upgrade to {currentTier === 'basic' ? 'Premium' : 'Enterprise'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusWidget;
