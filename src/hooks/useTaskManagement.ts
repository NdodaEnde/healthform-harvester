
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
      const { data: tasks, error } = await supabase
        .from('work_queue')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const urgentTasks = tasks?.filter(task => task.priority === 'urgent' && task.status === 'pending').length || 0;
      const overdueTasks = tasks?.filter(task => 
        task.due_date && 
        new Date(task.due_date) < now && 
        task.status === 'pending'
      ).length || 0;

      setState({
        tasks: tasks || [],
        loading: false,
        error: null,
        totalTasks: tasks?.length || 0,
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
      const { data, error } = await supabase
        .from('work_queue')
        .insert({
          ...taskData,
          organization_id: organizationId,
          status: 'pending',
          generated_from_analytics: false,
        })
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
