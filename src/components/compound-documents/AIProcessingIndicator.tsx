
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface AIProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
  result?: any;
}

interface AIProcessingIndicatorProps {
  documentId: string;
  steps: AIProcessingStep[];
  onRetry?: (stepId: string) => void;
}

const AIProcessingIndicator: React.FC<AIProcessingIndicatorProps> = ({
  documentId,
  steps,
  onRetry
}) => {
  const getStepIcon = (status: AIProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepColor = (status: AIProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const overallProgress = Math.round(
    (steps.filter(step => step.status === 'completed').length / steps.length) * 100
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Processing Pipeline
          <Badge variant="outline" className="ml-auto">
            {overallProgress}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} />
        </div>

        {/* Processing Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
              {getStepIcon(step.status)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{step.name}</h4>
                  <Badge className={getStepColor(step.status)}>
                    {step.status.toUpperCase()}
                  </Badge>
                </div>
                
                {step.status === 'processing' && step.progress && (
                  <Progress value={step.progress} className="mt-2" />
                )}
                
                {step.error && (
                  <p className="text-sm text-red-600 mt-1">{step.error}</p>
                )}
                
                {step.result && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {JSON.stringify(step.result).substring(0, 100)}...
                  </p>
                )}
              </div>

              {step.status === 'error' && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetry(step.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* AI Insights */}
        {overallProgress === 100 && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-800">AI Insights</span>
            </div>
            <p className="text-sm text-purple-700">
              Document processing completed successfully. All sections have been identified 
              and classified with high confidence. Ready for workflow assignment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIProcessingIndicator;
