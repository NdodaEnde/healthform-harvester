
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Download,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AccuracyMatrix from '@/components/AccuracyMatrix';
import { DocumentProcessingTrends } from '@/components/dashboard/DocumentProcessingTrends';
import ProcessingPipelineStatus from '@/components/documents/ProcessingPipelineStatus';
import ProcessingTimeMetrics from '@/components/documents/ProcessingTimeMetrics';
import DocumentTypePerformance from '@/components/documents/DocumentTypePerformance';
import QualityTrendsDashboard from '@/components/documents/QualityTrendsDashboard';
import RealtimeQueueMonitor from '@/components/documents/RealtimeQueueMonitor';

export default function DocumentAnalyticsPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/documents')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Processing Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into your document digitization pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Health Analytics
          </Button>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Live Dashboard
          </Badge>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Real-time Processing Status */}
      <RealtimeQueueMonitor />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DocumentProcessingTrends />
            <ProcessingTimeMetrics />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DocumentTypePerformance />
            <AccuracyMatrix />
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <ProcessingPipelineStatus />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DocumentTypePerformance />
            <ProcessingTimeMetrics />
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <QualityTrendsDashboard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccuracyMatrix />
            <DocumentTypePerformance />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProcessingTimeMetrics />
            <DocumentProcessingTrends />
          </div>
          <QualityTrendsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
