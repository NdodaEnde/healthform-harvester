
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  FileText, 
  User, 
  Bot, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Eye,
  Volume2,
  TestTube,
  Users,
  TrendingUp,
  Loader2,
  Sparkles,
  Database,
  Heart
} from 'lucide-react';

import { 
  useMedicalDocumentChatbot, 
  useMedicalDocumentStats, 
  useMedicalQuerySuggestions 
} from '@/hooks/useMedicalDocumentChatbot';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string;
  supporting_documents?: Array<{
    document_key: string;
    filename: string;
    patient_name?: string;
    relevant_findings: string[];
    confidence: number;
    validation_status: string;
  }>;
  medical_summary?: string;
  recommendations?: string[];
  documentCount?: number;
  isError?: boolean;
}

const MedicalDocumentChatInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your medical document assistant. I can help you analyze worker health records, test results, compliance status, and answer questions about your medical data. What would you like to know?',
      timestamp: new Date(Date.now() - 300000)
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const chatMutation = useMedicalDocumentChatbot();
  const { data: stats, isLoading: statsLoading } = useMedicalDocumentStats();
  const { data: suggestions } = useMedicalQuerySuggestions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = async () => {
    if (!query.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');

    try {
      const response = await chatMutation.mutateAsync({ query });
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        reasoning: response.reasoning,
        supporting_documents: response.supporting_documents,
        medical_summary: response.medical_summary,
        recommendations: response.recommendations,
        documentCount: response.documentCount
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error while analyzing your medical documents. Please try rephrasing your question or contact support if the issue persists.',
        timestamp: new Date(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTestIcon = (finding: string) => {
    const findingLower = finding.toLowerCase();
    if (findingLower.includes('vision') || findingLower.includes('eye')) return <Eye className="h-3 w-3" />;
    if (findingLower.includes('hearing') || findingLower.includes('audio')) return <Volume2 className="h-3 w-3" />;
    if (findingLower.includes('drug') || findingLower.includes('screen')) return <TestTube className="h-3 w-3" />;
    if (findingLower.includes('blood') || findingLower.includes('pressure')) return <Heart className="h-3 w-3" />;
    return <Stethoscope className="h-3 w-3" />;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      {/* Main Chat Interface */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Medical Document Assistant
            <Badge variant="secondary" className="ml-auto">
              <Stethoscope className="h-3 w-3 mr-1" />
              AI-Powered Analysis
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions about medical examinations, test results, worker fitness, and compliance using natural language
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="h-96 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-4">
              {chatHistory.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : message.isError
                      ? 'bg-red-100 text-red-600'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <div className={`flex-1 max-w-xs md:max-w-md lg:max-w-2xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.isError
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-background border shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Medical Summary */}
                      {message.medical_summary && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <p className="font-medium text-blue-800 mb-1">Medical Summary:</p>
                          <p className="text-blue-700">{message.medical_summary}</p>
                        </div>
                      )}

                      {/* Supporting Documents */}
                      {message.supporting_documents && message.supporting_documents.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Supporting Evidence:</p>
                          {message.supporting_documents.map((doc, docIndex) => (
                            <div key={docIndex} className="p-2 bg-muted/50 rounded text-xs space-y-1">
                              <div className="flex items-center gap-1 font-medium">
                                <FileText className="h-3 w-3" />
                                {doc.filename}
                                <Badge variant={doc.validation_status === 'validated' ? 'default' : 'secondary'} className="ml-1 text-xs">
                                  {doc.validation_status}
                                </Badge>
                              </div>
                              {doc.patient_name && (
                                <div className="text-muted-foreground">Patient: {doc.patient_name}</div>
                              )}
                              <div className="space-y-1">
                                {doc.relevant_findings.map((finding, findingIndex) => (
                                  <div key={findingIndex} className="flex items-center gap-1">
                                    {getTestIcon(finding)}
                                    <span>{finding}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">Confidence: {doc.confidence}/10</span>
                              </div>
                            </div>
                          ))}
                          
                          {message.documentCount && (
                            <p className="text-xs text-muted-foreground">
                              Analyzed {message.documentCount} medical documents
                            </p>
                          )}
                        </div>
                      )}

                      {/* Recommendations */}
                      {message.recommendations && message.recommendations.length > 0 && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                          <p className="font-medium text-green-800 mb-1">Recommendations:</p>
                          <ul className="text-green-700 space-y-1">
                            {message.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="text-green-600">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <Clock className="h-3 w-3" />
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-3 bg-background border shadow-sm rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Analyzing medical documents...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about medical examinations, test results, worker fitness..."
                className="flex-1"
                disabled={chatMutation.isPending}
              />
              <Button 
                onClick={handleSend}
                disabled={!query.trim() || chatMutation.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggested Questions */}
            {suggestions && suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Suggested Questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 6).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs h-7"
                      disabled={chatMutation.isPending}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="capabilities">AI Capabilities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Medical Document Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading statistics...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats?.totalDocuments || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Documents</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">{stats?.validatedDocuments || 0}</div>
                    <div className="text-sm text-muted-foreground">Validated</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{stats?.pendingDocuments || 0}</div>
                    <div className="text-sm text-muted-foreground">Pending Review</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{stats?.complianceRate || 0}%</div>
                    <div className="text-sm text-muted-foreground">Compliance Rate</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="capabilities">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Medical Analysis Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Vision Health Analysis</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Analyzes vision test results and identifies workers who may need corrective measures or workplace accommodations.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <TestTube className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Drug Screening Intelligence</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Processes drug screening results and identifies compliance patterns for workplace safety management.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">Hearing Conservation</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      Evaluates hearing test results and recommends hearing protection protocols for noise-exposed workers.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Fitness Assessment</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Comprehensive analysis of worker fitness status, medical restrictions, and compliance requirements.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MedicalDocumentChatInterface;
