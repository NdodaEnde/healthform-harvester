
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AnalyticsData {
  totalDocuments: number;
  processingTime: {
    average: number;
    median: number;
  };
  sectionTypes: Array<{
    type: string;
    count: number;
    accuracy: number;
  }>;
  workflowMetrics: {
    averageCompletionTime: number;
    bottlenecks: Array<{
      step: string;
      averageTime: number;
    }>;
  };
  qualityMetrics: {
    accuracyRate: number;
    reviewRate: number;
    errorRate: number;
  };
}

interface CompoundDocumentAnalyticsProps {
  data: AnalyticsData;
  timeRange: string;
}

const CompoundDocumentAnalytics: React.FC<CompoundDocumentAnalyticsProps> = ({
  data,
  timeRange
}) => {
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(data.processingTime.average)}
            </div>
            <p className="text-xs text-muted-foreground">
              Median: {formatTime(data.processingTime.median)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.qualityMetrics.accuracyRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              AI Processing Accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.qualityMetrics.reviewRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring Manual Review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Section Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.sectionTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.sectionTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workflow Bottlenecks */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Bottlenecks</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.workflowMetrics.bottlenecks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis tickFormatter={formatTime} />
                <Tooltip formatter={(value) => [formatTime(value as number), 'Avg Time']} />
                <Bar dataKey="averageTime" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section Accuracy Details */}
      <Card>
        <CardHeader>
          <CardTitle>AI Section Detection Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.sectionTypes.map((section, index) => (
              <div key={section.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="font-medium capitalize">
                      {section.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {section.count} documents
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={section.accuracy > 0.9 ? "default" : section.accuracy > 0.8 ? "secondary" : "destructive"}
                  >
                    {Math.round(section.accuracy * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompoundDocumentAnalytics;
