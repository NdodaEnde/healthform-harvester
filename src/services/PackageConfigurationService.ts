
import { PackageTier, FeatureKey } from '@/types/subscription';

export interface MetricConfig {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  isPremium?: boolean;
  isEnterprise?: boolean;
}

export interface LanguageConfig {
  dashboardTitle: string;
  executiveSummaryTitle: string;
  executiveSummaryDescription: string;
  upgradePromptTitle: string;
  upgradePromptDescription: string;
  featuresTitle: string;
}

export interface ColorConfig {
  primary: string;
  accent: string;
  background: string;
  border: string;
  text: string;
}

export interface PackageConfiguration {
  tier: PackageTier;
  displayName: string;
  metrics: MetricConfig[];
  language: LanguageConfig;
  colors: ColorConfig;
  maxUsers?: number;
  maxClients?: number;
  features: FeatureKey[];
  upgradeTarget?: PackageTier;
}

// Metric configurations
const basicMetrics: MetricConfig[] = [
  {
    id: 'active_employees',
    title: 'Active Employees',
    icon: 'Users',
    color: 'text-blue-600',
    description: 'Total active workforce'
  },
  {
    id: 'compliance_rate',
    title: 'Compliance Rate',
    icon: 'CheckCircle',
    color: 'text-green-600',
    description: 'Overall compliance percentage'
  },
  {
    id: 'expiring_certificates',
    title: 'Expiring Soon',
    icon: 'Clock',
    color: 'text-yellow-600',
    description: 'Certificates expiring in 30 days'
  },
  {
    id: 'monthly_tests',
    title: 'Monthly Tests',
    icon: 'FileText',
    color: 'text-gray-600',
    description: 'Tests completed this month'
  }
];

const premiumMetrics: MetricConfig[] = [
  {
    id: 'health_intelligence_score',
    title: 'Health Intelligence Score',
    icon: 'Target',
    color: 'text-purple-600',
    description: 'AI-powered health scoring',
    isPremium: true
  },
  {
    id: 'risk_predictions',
    title: 'Risk Predictions',
    icon: 'AlertTriangle',
    color: 'text-red-600',
    description: 'ML-powered risk detection',
    isPremium: true
  },
  {
    id: 'department_analytics',
    title: 'Department Analytics',
    icon: 'Building2',
    color: 'text-blue-600',
    description: 'Granular department insights',
    isPremium: true
  },
  {
    id: 'trend_accuracy',
    title: 'Trend Accuracy',
    icon: 'BarChart3',
    color: 'text-green-600',
    description: 'Predictive model accuracy',
    isPremium: true
  }
];

const enterpriseMetrics: MetricConfig[] = [
  {
    id: 'competitive_benchmarking',
    title: 'Market Benchmarking',
    icon: 'TrendingUp',
    color: 'text-purple-600',
    description: 'Industry performance comparison',
    isEnterprise: true
  },
  {
    id: 'roi_health_investments',
    title: 'Health ROI',
    icon: 'DollarSign',
    color: 'text-green-600',
    description: 'Return on health investments',
    isEnterprise: true
  },
  {
    id: 'regulatory_risk_score',
    title: 'Regulatory Risk',
    icon: 'Shield',
    color: 'text-red-600',
    description: 'Compliance risk assessment',
    isEnterprise: true
  },
  {
    id: 'custom_business_kpis',
    title: 'Custom KPIs',
    icon: 'Settings',
    color: 'text-gray-600',
    description: 'Tailored business metrics',
    isEnterprise: true
  }
];

// Package configurations
export const PACKAGE_CONFIGURATIONS: Record<PackageTier, PackageConfiguration> = {
  basic: {
    tier: 'basic',
    displayName: 'Essential Health Management',
    metrics: basicMetrics,
    language: {
      dashboardTitle: 'Health Overview',
      executiveSummaryTitle: 'Current Health Status',
      executiveSummaryDescription: 'Essential insights into your workforce health and compliance status.',
      upgradePromptTitle: 'Unlock Advanced Features',
      upgradePromptDescription: 'Upgrade to Premium for AI-powered insights and predictive analytics.',
      featuresTitle: 'Essential Features'
    },
    colors: {
      primary: 'bg-blue-600',
      accent: 'text-blue-600',
      background: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800'
    },
    maxUsers: 5,
    maxClients: 10,
    features: [
      'employee_status_overview',
      'compliance_tracking',
      'basic_reporting',
      'certificate_alerts',
      'simple_charts'
    ],
    upgradeTarget: 'premium'
  },
  
  premium: {
    tier: 'premium',
    displayName: 'Intelligent Health Analytics',
    metrics: [...basicMetrics, ...premiumMetrics],
    language: {
      dashboardTitle: 'Executive Health Intelligence',
      executiveSummaryTitle: 'AI-Powered Health Intelligence',
      executiveSummaryDescription: 'Advanced insights with trend analysis, risk intelligence, and predictive analytics.',
      upgradePromptTitle: 'Unlock Enterprise Features',
      upgradePromptDescription: 'Upgrade to Enterprise for competitive benchmarking and strategic insights.',
      featuresTitle: 'Premium Intelligence Features'
    },
    colors: {
      primary: 'bg-yellow-600',
      accent: 'text-yellow-600',
      background: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800'
    },
    maxUsers: 25,
    maxClients: 50,
    features: [
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
    upgradeTarget: 'enterprise'
  },
  
  enterprise: {
    tier: 'enterprise',
    displayName: 'Strategic Health Command Center',
    metrics: [...basicMetrics, ...premiumMetrics, ...enterpriseMetrics],
    language: {
      dashboardTitle: 'Strategic Health Command Center',
      executiveSummaryTitle: 'Executive Strategic Intelligence',
      executiveSummaryDescription: 'Comprehensive strategic insights with competitive benchmarking and board-ready analytics.',
      upgradePromptTitle: 'Full Platform Access',
      upgradePromptDescription: 'You have access to all enterprise features and capabilities.',
      featuresTitle: 'Enterprise Strategic Features'
    },
    colors: {
      primary: 'bg-purple-600',
      accent: 'text-purple-600',
      background: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800'
    },
    features: [
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
  }
};

export class PackageConfigurationService {
  static getConfig(tier: PackageTier): PackageConfiguration {
    return PACKAGE_CONFIGURATIONS[tier];
  }

  static getMetrics(tier: PackageTier): MetricConfig[] {
    return this.getConfig(tier).metrics;
  }

  static getLanguage(tier: PackageTier): LanguageConfig {
    return this.getConfig(tier).language;
  }

  static getColors(tier: PackageTier): ColorConfig {
    return this.getConfig(tier).colors;
  }

  static getDisplayName(tier: PackageTier): string {
    return this.getConfig(tier).displayName;
  }

  static hasFeature(tier: PackageTier, feature: FeatureKey): boolean {
    return this.getConfig(tier).features.includes(feature);
  }

  static getUpgradeTarget(tier: PackageTier): PackageTier | undefined {
    return this.getConfig(tier).upgradeTarget;
  }

  static getFeatureGateConfig(currentTier: PackageTier, requiredFeature: FeatureKey) {
    // Find the minimum tier that has this feature
    const tiers: PackageTier[] = ['basic', 'premium', 'enterprise'];
    const requiredTier = tiers.find(tier => this.hasFeature(tier, requiredFeature));
    
    if (!requiredTier) {
      return null;
    }

    const hasAccess = this.hasFeature(currentTier, requiredFeature);
    
    return {
      hasAccess,
      requiredTier,
      upgradeConfig: hasAccess ? null : this.getConfig(requiredTier)
    };
  }
}
