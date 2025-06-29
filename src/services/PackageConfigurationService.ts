
import { PackageTier, FeatureKey } from '@/types/subscription';

export interface MetricConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
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
  features: FeatureKey[];
}

export class PackageConfigurationService {
  private static readonly PACKAGE_CONFIGS: Record<PackageTier, PackageConfiguration> = {
    basic: {
      tier: 'basic',
      displayName: 'Basic',
      metrics: [
        {
          id: 'document_processing',
          title: 'Document Processing',
          description: 'Track document upload and processing rates',
          icon: 'FileText',
          color: 'blue'
        },
        {
          id: 'extraction_accuracy',
          title: 'Extraction Accuracy',
          description: 'Monitor AI extraction confidence and success rates',
          icon: 'Target',
          color: 'green'
        }
      ],
      language: {
        dashboardTitle: 'Document Processing Dashboard',
        executiveSummaryTitle: 'Processing Overview',
        executiveSummaryDescription: 'Monitor your document processing and extraction performance',
        upgradePromptTitle: 'Upgrade for Advanced Features',
        upgradePromptDescription: 'Get enhanced analytics and premium features',
        featuresTitle: 'Basic Features'
      },
      colors: {
        primary: 'bg-blue-600',
        accent: 'text-blue-600',
        background: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800'
      },
      features: [
        'basic_analytics',
        'document_upload',
        'text_extraction',
        'basic_reporting',
        'structured_extraction_v2',
        'extraction_comparison_tools',
        'structured_extraction_rollout'
      ]
    },
    premium: {
      tier: 'premium',
      displayName: 'Premium',
      metrics: [
        {
          id: 'advanced_analytics',
          title: 'Advanced Analytics',
          description: 'Deep insights into document processing patterns',
          icon: 'BarChart3',
          color: 'yellow'
        },
        {
          id: 'ai_insights',
          title: 'AI Insights',
          description: 'Machine learning powered recommendations',
          icon: 'Brain',
          color: 'purple'
        }
      ],
      language: {
        dashboardTitle: 'Premium Analytics Dashboard',
        executiveSummaryTitle: 'Executive Summary',
        executiveSummaryDescription: 'Comprehensive analytics and performance insights',
        upgradePromptTitle: 'Unlock Enterprise Features',
        upgradePromptDescription: 'Access strategic insights and competitive benchmarking',
        featuresTitle: 'Premium Features'
      },
      colors: {
        primary: 'bg-yellow-500',
        accent: 'text-yellow-600',
        background: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800'
      },
      features: [
        'basic_analytics',
        'document_upload',
        'text_extraction',
        'basic_reporting',
        'structured_extraction_v2',
        'extraction_comparison_tools',
        'structured_extraction_rollout',
        'advanced_analytics',
        'custom_branding',
        'priority_support',
        'department_breakdowns'
      ]
    },
    enterprise: {
      tier: 'enterprise',
      displayName: 'Enterprise',
      metrics: [
        {
          id: 'strategic_insights',
          title: 'Strategic Insights',
          description: 'Enterprise-level strategic analysis and forecasting',
          icon: 'TrendingUp',
          color: 'purple'
        },
        {
          id: 'competitive_analysis',
          title: 'Competitive Analysis',
          description: 'Industry benchmarking and competitive positioning',
          icon: 'Target',
          color: 'red'
        }
      ],
      language: {
        dashboardTitle: 'Enterprise Strategic Dashboard',
        executiveSummaryTitle: 'Strategic Overview',
        executiveSummaryDescription: 'Strategic insights and competitive intelligence',
        upgradePromptTitle: 'Maximum Enterprise Value',
        upgradePromptDescription: 'You have access to all premium features',
        featuresTitle: 'Enterprise Features'
      },
      colors: {
        primary: 'bg-purple-600',
        accent: 'text-purple-600',
        background: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-800'
      },
      features: [
        'basic_analytics',
        'document_upload',
        'text_extraction',
        'basic_reporting',
        'structured_extraction_v2',
        'extraction_comparison_tools',
        'structured_extraction_rollout',
        'advanced_analytics',
        'custom_branding',
        'priority_support',
        'department_breakdowns',
        'competitive_benchmarking',
        'api_access',
        'white_label'
      ]
    }
  };

  static getConfig(tier: PackageTier): PackageConfiguration {
    return this.PACKAGE_CONFIGS[tier];
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

  static getFeatureGateConfig(tier: PackageTier, feature: FeatureKey) {
    const hasAccess = this.hasFeature(tier, feature);
    
    if (hasAccess) {
      return { hasAccess: true };
    }

    // Determine required tier for feature
    for (const [tierName, config] of Object.entries(this.PACKAGE_CONFIGS)) {
      if (config.features.includes(feature)) {
        return {
          hasAccess: false,
          requiredTier: tierName as PackageTier,
          upgradeConfig: config
        };
      }
    }

    return { hasAccess: false };
  }

  static getUpgradeTarget(currentTier: PackageTier): PackageTier | undefined {
    switch (currentTier) {
      case 'basic':
        return 'premium';
      case 'premium':
        return 'enterprise';
      case 'enterprise':
        return undefined;
      default:
        return 'premium';
    }
  }
}
