import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  organization_id: string;
  assigned_to?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  task_template_id?: string;
  generated_from_analytics: boolean;
  risk_score?: string;
  estimated_duration?: string;
  compliance_deadline?: string;
}

interface TaskManagementState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  totalTasks: number;
  urgentTasks: number;
  overdueTasks: number;
}

export function useTaskManagement() {
  const { getEffectiveOrganizationId } = useOrganization();
  const [state, setState] = useState<TaskManagementState>({
    tasks: [],
    loading: true,
    error: null,
    totalTasks: 0,
    urgentTasks: 0,
    overdueTasks: 0,
  });

  const fetchTasks = useCallback(async () => {
    const organizationId = getEffectiveOrganizationId();
    
    if (!organizationId) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'No organization selected'
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: rawTasks, error } = await supabase
        .from('work_queue')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform raw tasks to ensure type safety
      const tasks: Task[] = (rawTasks || []).map(task => ({
        ...task,
        priority: ['low', 'medium', 'high', 'urgent'].includes(task.priority) 
          ? task.priority as 'low' | 'medium' | 'high' | 'urgent'
          : 'medium', // fallback to medium if invalid priority
        status: ['pending', 'in_progress', 'completed', 'cancelled'].includes(task.status)
          ? task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
          : 'pending', // fallback to pending if invalid status
        estimated_duration: task.estimated_duration ? String(task.estimated_duration) : undefined,
        description: task.description || '',
        assigned_to: task.assigned_to || undefined,
        related_entity_id: task.related_entity_id || undefined,
        related_entity_type: task.related_entity_type || undefined,
        due_date: task.due_date || undefined,
        task_template_id: task.task_template_id || undefined,
        risk_score: task.risk_score || undefined,
        compliance_deadline: task.compliance_deadline || undefined
      }));

      const now = new Date();
      const urgentTasks = tasks.filter(task => task.priority === 'urgent' && task.status === 'pending').length;
      const overdueTasks = tasks.filter(task => 
        task.due_date && 
        new Date(task.due_date) < now && 
        task.status === 'pending'
      ).length;

      setState({
        tasks,
        loading: false,
        error: null,
        totalTasks: tasks.length,
        urgentTasks,
        overdueTasks,
      });

    } catch (error) {
      console.error('Error fetching tasks:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks'
      }));
    }
  }, [getEffectiveOrganizationId]);

  const generateComplianceTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('generate_compliance_tasks');
      
      if (error) throw error;
      
      console.log(`Generated ${data} compliance tasks`);
      await fetchTasks(); // Refresh tasks list
      return data;
    } catch (error) {
      console.error('Error generating compliance tasks:', error);
      throw error;
    }
  }, [fetchTasks]);

  const generateRiskFollowupTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('generate_risk_followup_tasks');
      
      if (error) throw error;
      
      console.log(`Generated ${data} risk follow-up tasks`);
      await fetchTasks(); // Refresh tasks list
      return data;
    } catch (error) {
      console.error('Error generating risk follow-up tasks:', error);
      throw error;
    }
  }, [fetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('work_queue')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks(); // Refresh tasks list
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }, [fetchTasks]);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    const organizationId = getEffectiveOrganizationId();
    
    if (!organizationId) throw new Error('No organization selected');

    try {
      // Map our Task interface to the database schema
      const dbTaskData = {
        title: taskData.title || '',
        description: taskData.description,
        type: taskData.type || 'general',
        priority: taskData.priority || 'medium',
        organization_id: organizationId,
        status: 'pending',
        generated_from_analytics: false,
        assigned_to: taskData.assigned_to,
        related_entity_id: taskData.related_entity_id,
        related_entity_type: taskData.related_entity_type,
        due_date: taskData.due_date,
        task_template_id: taskData.task_template_id,
        risk_score: taskData.risk_score,
        estimated_duration: taskData.estimated_duration,
        compliance_deadline: taskData.compliance_deadline,
      };

      const { data, error } = await supabase
        .from('work_queue')
        .insert(dbTaskData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchTasks(); // Refresh tasks list
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, [getEffectiveOrganizationId, fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    ...state,
    fetchTasks,
    generateComplianceTasks,
    generateRiskFollowupTasks,
    updateTaskStatus,
    createTask,
  };
}
