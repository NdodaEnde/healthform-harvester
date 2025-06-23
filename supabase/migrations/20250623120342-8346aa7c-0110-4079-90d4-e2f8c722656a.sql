
-- Extend work_queue table with analytics-specific fields
ALTER TABLE work_queue ADD COLUMN IF NOT EXISTS task_template_id uuid;
ALTER TABLE work_queue ADD COLUMN IF NOT EXISTS generated_from_analytics boolean DEFAULT false;
ALTER TABLE work_queue ADD COLUMN IF NOT EXISTS risk_score text;
ALTER TABLE work_queue ADD COLUMN IF NOT EXISTS estimated_duration interval;
ALTER TABLE work_queue ADD COLUMN IF NOT EXISTS compliance_deadline date;

-- Create task templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  priority text NOT NULL,
  estimated_duration interval,
  auto_assign_rules jsonb,
  template_data jsonb,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on task_templates
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for task_templates
CREATE POLICY "Users can view their organization's task templates" 
  ON task_templates 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage task templates" 
  ON task_templates 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organization_users 
      WHERE user_id = auth.uid() 
      AND organization_id = task_templates.organization_id 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create function to auto-generate compliance tasks
CREATE OR REPLACE FUNCTION generate_compliance_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_count integer := 0;
  compliance_record RECORD;
BEGIN
  -- Generate tasks for certificates expiring in 30 days
  FOR compliance_record IN 
    SELECT cc.*, p.first_name, p.last_name, o.name as org_name
    FROM certificate_compliance cc
    JOIN patients p ON cc.patient_id = p.id
    JOIN organizations o ON cc.organization_id = o.id
    WHERE cc.days_until_expiry BETWEEN 1 AND 30
    AND cc.is_compliant = false
    AND NOT EXISTS (
      SELECT 1 FROM work_queue wq 
      WHERE wq.related_entity_id = cc.patient_id 
      AND wq.type = 'certificate_renewal'
      AND wq.status = 'pending'
    )
  LOOP
    INSERT INTO work_queue (
      title,
      description,
      type,
      priority,
      organization_id,
      related_entity_id,
      related_entity_type,
      due_date,
      generated_from_analytics,
      risk_score,
      compliance_deadline
    ) VALUES (
      'Certificate Renewal Required: ' || compliance_record.first_name || ' ' || compliance_record.last_name,
      'Patient certificate expires in ' || compliance_record.days_until_expiry || ' days. Immediate action required.',
      'certificate_renewal',
      CASE 
        WHEN compliance_record.days_until_expiry <= 7 THEN 'urgent'
        WHEN compliance_record.days_until_expiry <= 14 THEN 'high'
        ELSE 'medium'
      END,
      compliance_record.organization_id,
      compliance_record.patient_id,
      'patient',
      compliance_record.current_expiry_date,
      true,
      CASE 
        WHEN compliance_record.days_until_expiry <= 7 THEN 'high'
        WHEN compliance_record.days_until_expiry <= 14 THEN 'medium'
        ELSE 'low'
      END,
      compliance_record.current_expiry_date
    );
    
    task_count := task_count + 1;
  END LOOP;
  
  RETURN task_count;
END;
$$;

-- Create function to generate risk-based follow-up tasks
CREATE OR REPLACE FUNCTION generate_risk_followup_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_count integer := 0;
  risk_record RECORD;
BEGIN
  -- Generate tasks for high-risk cases that need follow-up
  FOR risk_record IN 
    SELECT DISTINCT ra.*, p.first_name, p.last_name
    FROM v_risk_assessment_matrix_refined ra
    JOIN patients p ON p.organization_id = ra.organization_id
    WHERE ra.risk_level = 'high'
    AND NOT EXISTS (
      SELECT 1 FROM work_queue wq 
      WHERE wq.organization_id = ra.organization_id
      AND wq.type = 'risk_followup'
      AND wq.status = 'pending'
      AND wq.created_at > NOW() - INTERVAL '7 days'
    )
  LOOP
    INSERT INTO work_queue (
      title,
      description,
      type,
      priority,
      organization_id,
      related_entity_type,
      due_date,
      generated_from_analytics,
      risk_score
    ) VALUES (
      'High Risk Follow-up Required: ' || risk_record.test_type,
      'High risk detected in ' || risk_record.test_type || ' for ' || risk_record.job_title || ' role. Risk explanation: ' || risk_record.risk_explanation,
      'risk_followup',
      'urgent',
      risk_record.organization_id,
      'risk_assessment',
      NOW() + INTERVAL '3 days',
      true,
      'high'
    );
    
    task_count := task_count + 1;
  END LOOP;
  
  RETURN task_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_queue_generated_analytics ON work_queue(generated_from_analytics);
CREATE INDEX IF NOT EXISTS idx_work_queue_risk_score ON work_queue(risk_score);
CREATE INDEX IF NOT EXISTS idx_work_queue_compliance_deadline ON work_queue(compliance_deadline);
CREATE INDEX IF NOT EXISTS idx_task_templates_org ON task_templates(organization_id);
