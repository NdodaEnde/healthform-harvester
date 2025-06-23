
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useTaskManagement } from '@/hooks/useTaskManagement';

interface TaskWidgetProps {
  variant?: 'compact' | 'detailed';
  maxTasks?: number;
  showActions?: boolean;
}

const TaskWidget: React.FC<TaskWidgetProps> = ({ 
  variant = 'compact', 
  maxTasks = 5,
  showActions = true 
}) => {
  const { 
    tasks, 
    loading, 
    urgentTasks, 
    overdueTasks,
    updateTaskStatus 
  } = useTaskManagement();

  const pendingTasks = tasks.filter(task => task.status === 'pending').slice(0, maxTasks);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'certificate_renewal': return <Calendar className="h-4 w-4" />;
      case 'risk_followup': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Active Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex gap-2">
              {urgentTasks > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {urgentTasks} Urgent
                </Badge>
              )}
              {overdueTasks > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {overdueTasks} Overdue
                </Badge>
              )}
            </div>
            
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending tasks</p>
            ) : (
              <div className="space-y-1">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    {getTaskIcon(task.type)}
                    <span className="truncate flex-1">{task.title}</span>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                
                {pendingTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{pendingTasks.length - 3} more tasks
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Task Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{pendingTasks.length}</div>
              <div className="text-xs text-blue-700">Pending</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">{urgentTasks}</div>
              <div className="text-xs text-red-700">Urgent</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{overdueTasks}</div>
              <div className="text-xs text-orange-700">Overdue</div>
            </div>
          </div>

          <div className="space-y-2">
            {pendingTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No pending tasks</p>
            ) : (
              pendingTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTaskIcon(task.type)}
                      <span className="font-medium text-sm">{task.title}</span>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                  
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}

                  {showActions && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className="h-7 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        className="h-7 text-xs"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskWidget;
