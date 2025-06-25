
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  Plus
} from 'lucide-react';
import { useTaskManagement } from '@/hooks/useTaskManagement';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGate from '@/components/FeatureGate';
import TaskWidget from './TaskWidget';

const TaskManagementDashboard: React.FC = () => {
  const { 
    tasks, 
    loading, 
    error,
    totalTasks,
    urgentTasks,
    overdueTasks,
    fetchTasks,
    generateComplianceTasks,
    generateRiskFollowupTasks 
  } = useTaskManagement();
  const { canAccessFeature } = useSubscription();

  const [generatingTasks, setGeneratingTasks] = useState(false);

  const handleGenerateComplianceTasks = async () => {
    setGeneratingTasks(true);
    try {
      const count = await generateComplianceTasks();
      console.log(`Generated ${count} compliance tasks`);
    } catch (error) {
      console.error('Failed to generate compliance tasks:', error);
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleGenerateRiskTasks = async () => {
    setGeneratingTasks(true);
    try {
      const count = await generateRiskFollowupTasks();
      console.log(`Generated ${count} risk follow-up tasks`);
    } catch (error) {
      console.error('Failed to generate risk tasks:', error);
    } finally {
      setGeneratingTasks(false);
    }
  };

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  const completionRate = totalTasks > 0 ? 
    (tasksByStatus.completed.length / totalTasks * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Advanced Task Management</h1>
          <p className="text-muted-foreground">
            Intelligent task automation and workflow management
          </p>
        </div>
        <Button 
          onClick={fetchTasks} 
          variant="outline" 
          size="sm"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Advanced Stats - Premium Feature */}
      <FeatureGate requiredTier="premium">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{totalTasks}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Urgent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{urgentTasks}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{overdueTasks}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {Math.round(completionRate)}%
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureGate>

      {/* Automated Task Generation - Premium Feature */}
      <FeatureGate requiredTier="premium">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-purple-600" />
              Intelligent Task Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleGenerateComplianceTasks}
                disabled={generatingTasks}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="h-4 w-4" />
                Generate Compliance Tasks
              </Button>
              <Button 
                onClick={handleGenerateRiskTasks}
                disabled={generatingTasks}
                variant="outline"
                className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4" />
                Generate Risk Follow-ups
              </Button>
              <Button 
                variant="outline"
                className="flex items-center gap-2 border-gray-300"
              >
                <Plus className="h-4 w-4" />
                Create Manual Task
              </Button>
            </div>
          </CardContent>
        </Card>
      </FeatureGate>

      {/* Manual Task Creation - Available for all tiers */}
      {!canAccessFeature('premium') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Manual Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Task Content - Advanced tabs for Premium+ */}
      <FeatureGate 
        requiredTier="premium"
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskWidget variant="compact" maxTasks={10} showActions={false} />
            </CardContent>
          </Card>
        }
      >
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">
              Active ({tasksByStatus.pending.length + tasksByStatus.in_progress.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({tasksByStatus.pending.length})
            </TabsTrigger>
            <TabsTrigger value="progress">
              In Progress ({tasksByStatus.in_progress.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({tasksByStatus.completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TaskWidget variant="detailed" maxTasks={10} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Tasks</span>
                      <span className="font-medium">{tasksByStatus.pending.length + tasksByStatus.in_progress.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completion Rate</span>
                      <span className="font-medium">{Math.round(completionRate)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Priority Distribution</span>
                      <div className="flex gap-1">
                        {urgentTasks > 0 && <Badge variant="destructive" className="text-xs">High</Badge>}
                        <Badge variant="secondary" className="text-xs">Normal</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <TaskWidget variant="detailed" maxTasks={20} />
          </TabsContent>

          <TabsContent value="progress">
            <div className="space-y-4">
              {tasksByStatus.in_progress.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg">No tasks in progress</p>
                    <p className="text-sm text-muted-foreground">Tasks will appear here when started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {tasksByStatus.in_progress.map((task) => (
                    <Card key={task.id} className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                            In Progress
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              {tasksByStatus.completed.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg">No completed tasks</p>
                    <p className="text-sm text-muted-foreground">Completed tasks will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {tasksByStatus.completed.map((task) => (
                    <Card key={task.id} className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </FeatureGate>
    </div>
  );
};

export default TaskManagementDashboard;
