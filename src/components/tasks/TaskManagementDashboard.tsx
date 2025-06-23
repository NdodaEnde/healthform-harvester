
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  RefreshCw, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Users,
  TrendingUp
} from 'lucide-react';
import { useTaskManagement } from '@/hooks/useTaskManagement';
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Intelligent task automation and workflow management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchTasks} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              All tasks in system
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentTasks}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(completionRate)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Generation Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Intelligent Task Generation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Auto-generate tasks from analytics data and risk assessments
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleGenerateComplianceTasks}
              disabled={generatingTasks}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Generate Compliance Tasks
            </Button>
            <Button 
              onClick={handleGenerateRiskTasks}
              disabled={generatingTasks}
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Generate Risk Follow-ups
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Manual Task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({tasksByStatus.pending.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({tasksByStatus.in_progress.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({tasksByStatus.completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaskWidget variant="detailed" maxTasks={10} />
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Task activity timeline will be displayed here
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <TaskWidget variant="detailed" maxTasks={20} />
        </TabsContent>

        <TabsContent value="in_progress">
          <div className="space-y-4">
            {tasksByStatus.in_progress.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No tasks in progress</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tasksByStatus.in_progress.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
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
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No completed tasks</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tasksByStatus.completed.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
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
    </div>
  );
};

export default TaskManagementDashboard;
