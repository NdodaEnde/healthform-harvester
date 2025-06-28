
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  Users, 
  Clock,
  Target,
  CheckCircle,
  X
} from 'lucide-react';
import { CompoundDocument } from '@/types/compound-document';

interface WorkflowSuggestion {
  id: string;
  type: 'priority' | 'assignment' | 'optimization' | 'quality';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  action: {
    type: string;
    data: any;
  };
}

interface SmartWorkflowSuggestionsProps {
  document: CompoundDocument;
  suggestions: WorkflowSuggestion[];
  onApplySuggestion?: (suggestion: WorkflowSuggestion) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
}

const SmartWorkflowSuggestions: React.FC<SmartWorkflowSuggestionsProps> = ({
  document,
  suggestions,
  onApplySuggestion,
  onDismissSuggestion
}) => {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const getSuggestionIcon = (type: WorkflowSuggestion['type']) => {
    switch (type) {
      case 'priority':
        return <Target className="h-4 w-4" />;
      case 'assignment':
        return <Users className="h-4 w-4" />;
      case 'optimization':
        return <TrendingUp className="h-4 w-4" />;
      case 'quality':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: WorkflowSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApplySuggestion = (suggestion: WorkflowSuggestion) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    onApplySuggestion?.(suggestion);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    onDismissSuggestion?.(suggestionId);
  };

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Workflow Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No suggestions available at this time.</p>
            <p className="text-sm mt-1">AI analysis will provide recommendations as data becomes available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Smart Workflow Suggestions
          <Badge variant="outline" className="ml-auto">
            {suggestions.length} suggestions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-4 border rounded-lg transition-opacity ${
              appliedSuggestions.has(suggestion.id) ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getSuggestionIcon(suggestion.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{suggestion.title}</h4>
                  <Badge className={getImpactColor(suggestion.impact)}>
                    {suggestion.impact.toUpperCase()} IMPACT
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(suggestion.confidence * 100)}% confident
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {suggestion.description}
                </p>
                
                <div className="flex items-center gap-2">
                  {!appliedSuggestions.has(suggestion.id) && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                      >
                        Apply Suggestion
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </>
                  )}
                  
                  {appliedSuggestions.has(suggestion.id) && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Applied
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* AI Learning Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">AI Learning</span>
          </div>
          <p className="text-sm text-blue-700">
            Suggestions improve over time based on your workflow patterns and outcomes. 
            Applying or dismissing suggestions helps train the AI for better recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartWorkflowSuggestions;
