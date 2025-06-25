
export type PackageTier = 'basic' | 'premium' | 'enterprise';

export type FeatureKey = 
  | 'employee_status_overview'
  | 'compliance_tracking'
  | 'basic_reporting'
  | 'certificate_alerts'
  | 'simple_charts'
  | 'trend_analysis'
  | 'risk_intelligence'
  | 'advanced_reporting'
  | 'department_breakdowns'
  | 'custom_branding'
  | 'automated_scheduling'
  | 'predictive_analytics'
  | 'competitive_benchmarking'
  | 'api_access'
  | 'custom_integrations'
  | 'white_label_reports'
  | 'dedicated_support';

export interface SubscriptionPackage {
  id: string;
  name: string;
  tier: PackageTier;
  price: number;
  billing_cycle: 'monthly' | 'annual';
  features: FeatureKey[];
  max_users?: number;
  max_clients?: number;
  api_access: boolean;
  custom_branding: boolean;
  priority_support: boolean;
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  package_tier: PackageTier;
  package_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trial';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export const PACKAGE_FEATURES: Record<PackageTier, FeatureKey[]> = {
  basic: [
    'employee_status_overview',
    'compliance_tracking',
    'basic_reporting',
    'certificate_alerts',
    'simple_charts'
  ],
  premium: [
    'employee_status_overview',
    'compliance_tracking',
    'basic_reporting',
    'certificate_alerts',
    'simple_charts',
    'trend_analysis',
    'risk_intelligence',
    'advanced_reporting',
    'department_breakdowns',
    'custom_branding',
    'automated_scheduling'
  ],
  enterprise: [
    'employee_status_overview',
    'compliance_tracking',
    'basic_reporting',
    'certificate_alerts',
    'simple_charts',
    'trend_analysis',
    'risk_intelligence',
    'advanced_reporting',
    'department_breakdowns',
    'custom_branding',
    'automated_scheduling',
    'predictive_analytics',
    'competitive_benchmarking',
    'api_access',
    'custom_integrations',
    'white_label_reports',
    'dedicated_support'
  ]
};

export const DEFAULT_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'basic-monthly',
    name: 'Basic',
    tier: 'basic',
    price: 99,
    billing_cycle: 'monthly',
    features: PACKAGE_FEATURES.basic,
    max_users: 5,
    max_clients: 10,
    api_access: false,
    custom_branding: false,
    priority_support: false
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    tier: 'premium',
    price: 299,
    billing_cycle: 'monthly',
    features: PACKAGE_FEATURES.premium,
    max_users: 25,
    max_clients: 50,
    api_access: false,
    custom_branding: true,
    priority_support: true
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 999,
    billing_cycle: 'monthly',
    features: PACKAGE_FEATURES.enterprise,
    api_access: true,
    custom_branding: true,
    priority_support: true
  }
];
