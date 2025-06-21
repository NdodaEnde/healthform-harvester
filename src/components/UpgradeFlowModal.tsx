
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Zap, Crown, Loader2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';

interface UpgradeFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier: PackageTier;
}

type UpgradeStep = 'features' | 'billing' | 'confirmation' | 'processing' | 'complete';

const UpgradeFlowModal: React.FC<UpgradeFlowModalProps> = ({
  isOpen,
  onClose,
  targetTier
}) => {
  const { upgradePackage, currentTier, colors } = usePackage();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<UpgradeStep>('features');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const tierInfo = {
    premium: {
      name: 'Premium',
      price: '$299',
      icon: Zap,
      color: 'text-yellow-600',
      gradient: 'from-yellow-500 to-orange-500',
      features: [
        'AI-powered health intelligence',
        'Advanced analytics & reporting',
        'Department-level breakdowns', 
        'Custom branding options',
        'Automated scheduling',
        'Risk intelligence insights'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: '$999',
      icon: Crown,
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-500',
      features: [
        'Everything in Premium',
        'Competitive benchmarking',
        'Strategic command center',
        'API access & integrations',
        'White-label reports',
        'Dedicated support',
        'Custom business KPIs'
      ]
    }
  };

  const info = tierInfo[targetTier as keyof typeof tierInfo];
  const IconComponent = info?.icon || Zap;

  const steps: { key: UpgradeStep; title: string; description: string }[] = [
    { key: 'features', title: 'Features Overview', description: 'Discover what you\'ll unlock' },
    { key: 'billing', title: 'Billing Details', description: 'Review your subscription' },
    { key: 'confirmation', title: 'Confirm Upgrade', description: 'Ready to upgrade' },
    { key: 'processing', title: 'Processing', description: 'Upgrading your account' },
    { key: 'complete', title: 'Complete', description: 'Welcome to ' + info?.name }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleUpgrade = async () => {
    setCurrentStep('processing');
    setIsUpgrading(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = await upgradePackage(targetTier);
      if (success) {
        setCurrentStep('complete');
        toast({
          title: "Upgrade Successful!",
          description: `Welcome to ${info?.name}! Your new features are now available.`,
          variant: "default"
        });
      } else {
        throw new Error('Upgrade failed');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      setCurrentStep('confirmation');
      toast({
        title: "Upgrade Failed",
        description: "There was an issue processing your upgrade. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleComplete = () => {
    onClose();
    // Refresh to show new features
    setTimeout(() => window.location.reload(), 1000);
  };

  const resetModal = () => {
    setCurrentStep('features');
    setIsUpgrading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!info) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'features':
        return (
          <div className="space-y-6">
            <div className={`text-center p-6 rounded-lg bg-gradient-to-r ${info.gradient} bg-opacity-10`}>
              <div className={`mx-auto mb-4 p-4 rounded-full bg-gradient-to-r ${info.gradient} text-white w-fit`}>
                <IconComponent className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Unlock {info.name}</h3>
              <p className="text-muted-foreground">
                Discover powerful features designed to transform your workflow
              </p>
            </div>

            <div className="grid gap-3">
              {info.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                  <div className={`p-1 rounded-full bg-gradient-to-r ${info.gradient}`}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                  <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Subscription Summary</span>
                  <Badge variant="outline" className={info.color}>
                    {info.price}/month
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Current Plan:</span>
                  <span className="capitalize font-medium">{currentTier}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Upgrading to:</span>
                  <span className="font-medium">{info.name}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Monthly Total:</span>
                    <span>{info.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Your subscription will be upgraded immediately.</p>
              <p>You can cancel or downgrade at any time.</p>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6 text-center">
            <div className={`p-6 rounded-lg bg-gradient-to-r ${info.gradient} bg-opacity-10`}>
              <IconComponent className={`h-12 w-12 mx-auto mb-4 ${info.color}`} />
              <h3 className="text-xl font-bold mb-2">Ready to Upgrade?</h3>
              <p className="text-muted-foreground">
                You're about to unlock {info.name} features and transform your workflow.
              </p>
            </div>
            
            <div className="text-left space-y-2">
              <p className="text-sm font-medium">What happens next:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  Instant access to all {info.name} features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  Your data and settings remain unchanged
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  No setup required - features activate automatically
                </li>
              </ul>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6 text-center py-8">
            <div className={`mx-auto p-6 rounded-full bg-gradient-to-r ${info.gradient} bg-opacity-10 w-fit`}>
              <Loader2 className={`h-12 w-12 animate-spin ${info.color}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Upgrading Your Account</h3>
              <p className="text-muted-foreground">
                Please wait while we activate your {info.name} features...
              </p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center py-8">
            <div className={`mx-auto p-6 rounded-full bg-gradient-to-r ${info.gradient} text-white w-fit`}>
              <Check className="h-12 w-12" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Welcome to {info.name}!</h3>
              <p className="text-muted-foreground">
                Your account has been successfully upgraded. All {info.name} features are now active.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-800">
                🎉 Your enhanced features are ready to use. Refresh the page to see your new capabilities!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderActions = () => {
    switch (currentStep) {
      case 'features':
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleNext} className="flex-1">
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case 'billing':
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevious} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext} className="flex-1">
              Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case 'confirmation':
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevious} className="flex-1" disabled={isUpgrading}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleUpgrade} className="flex-1" disabled={isUpgrading}>
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upgrading...
                </>
              ) : (
                `Upgrade to ${info.name}`
              )}
            </Button>
          </div>
        );

      case 'processing':
        return (
          <div className="flex justify-center">
            <Button disabled className="px-8">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          </div>
        );

      case 'complete':
        return (
          <Button onClick={handleComplete} className="w-full">
            Get Started with {info.name}
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={`h-6 w-6 ${info.color}`} />
            {steps[currentStepIndex]?.title}
          </DialogTitle>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.description}
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {renderStepContent()}
          {renderActions()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeFlowModal;
