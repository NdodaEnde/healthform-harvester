
import { PackageTier, FeatureKey } from '@/types/subscription';
import { PackageConfigurationService } from '@/services/PackageConfigurationService';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  icon?: string;
  color?: string;
  tier?: PackageTier;
  feature?: FeatureKey;
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'health' | 'compliance' | 'risk' | 'efficiency';
  tier: PackageTier;
  recommendation?: string;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  metrics: AnalyticsMetric[];
  insights: AnalyticsInsight[];
  generatedAt: Date;
  tier: PackageTier;
}

class AnalyticsService {
  private static mockData = {
    employees: 156,
    compliance_rate: 87.5,
    expiring_certificates: 12,
    monthly_tests: 89,
    health_score: 8.2,
    risk_alerts: 3,
    department_count: 8,
    trend_accuracy: 94.2,
    benchmark_score: 112,
    roi_percentage: 23.4,
    regulatory_risk: 2.1,
    custom_kpis: 6
  };

  static getMetricsForTier(tier: PackageTier): AnalyticsMetric[] {
    const basicMetrics: AnalyticsMetric[] = [
      {
        id: 'active_employees',
        name: 'Active Employees',
        value: this.mockData.employees,
        change: 5.2,
        trend: 'up',
        format: 'number',
        icon: 'Users',
        color: 'text-blue-600'
      },
      {
        id: 'compliance_rate',
        name: 'Compliance Rate',
        value: this.mockData.compliance_rate,
        change: 2.1,
        trend: 'up',
        format: 'percentage',
        icon: 'CheckCircle',
        color: 'text-green-600'
      },
      {
        id: 'expiring_certificates',
        name: 'Expiring Soon',
        value: this.mockData.expiring_certificates,
        change: -15.3,
        trend: 'down',
        format: 'number',
        icon: 'Clock',
        color: 'text-yellow-600'
      },
      {
        id: 'monthly_tests',
        name: 'Monthly Tests',
        value: this.mockData.monthly_tests,
        change: 8.7,
        trend: 'up',
        format: 'number',
        icon: 'FileText',
        color: 'text-gray-600'
      }
    ];

    const premiumMetrics: AnalyticsMetric[] = [
      {
        id: 'health_intelligence_score',
        name: 'Health Intelligence Score',
        value: this.mockData.health_score,
        change: 0.3,
        trend: 'up',
        format: 'number',
        icon: 'Target',
        color: 'text-purple-600',
        tier: 'premium',
        feature: 'risk_intelligence'
      },
      {
        id: 'risk_predictions',
        name: 'Active Risk Alerts',
        value: this.mockData.risk_alerts,
        change: -25.0,
        trend: 'down',
        format: 'number',
        icon: 'AlertTriangle',
        color: 'text-red-600',
        tier: 'premium',
        feature: 'risk_intelligence'
      },
      {
        id: 'department_analytics',
        name: 'Departments Tracked',
        value: this.mockData.department_count,
        change: 12.5,
        trend: 'up',
        format: 'number',
        icon: 'Building2',
        color: 'text-blue-600',
        tier: 'premium',
        feature: 'department_breakdowns'
      },
      {
        id: 'trend_accuracy',
        name: 'Prediction Accuracy',
        value: this.mockData.trend_accuracy,
        change: 1.8,
        trend: 'up',
        format: 'percentage',
        icon: 'BarChart3',
        color: 'text-green-600',
        tier: 'premium',
        feature: 'trend_analysis'
      }
    ];

    const enterpriseMetrics: AnalyticsMetric[] = [
      {
        id: 'competitive_benchmarking',
        name: 'Industry Benchmark',
        value: this.mockData.benchmark_score,
        change: 5.4,
        trend: 'up',
        format: 'number',
        icon: 'TrendingUp',
        color: 'text-purple-600',
        tier: 'enterprise',
        feature: 'competitive_benchmarking'
      },
      {
        id: 'roi_health_investments',
        name: 'Health ROI',
        value: this.mockData.roi_percentage,
        change: 3.2,
        trend: 'up',
        format: 'percentage',
        icon: 'DollarSign',
        color: 'text-green-600',
        tier: 'enterprise',
        feature: 'competitive_benchmarking'
      },
      {
        id: 'regulatory_risk_score',
        name: 'Regulatory Risk Score',
        value: this.mockData.regulatory_risk,
        change: -8.7,
        trend: 'down',
        format: 'number',
        icon: 'Shield',
        color: 'text-red-600',
        tier: 'enterprise',
        feature: 'competitive_benchmarking'
      },
      {
        id: 'custom_business_kpis',
        name: 'Custom KPIs Active',
        value: this.mockData.custom_kpis,
        change: 20.0,
        trend: 'up',
        format: 'number',
        icon: 'Settings',
        color: 'text-gray-600',
        tier: 'enterprise',
        feature: 'api_access'
      }
    ];

    switch (tier) {
      case 'basic':
        return basicMetrics;
      case 'premium':
        return [...basicMetrics, ...premiumMetrics];
      case 'enterprise':
        return [...basicMetrics, ...premiumMetrics, ...enterpriseMetrics];
      default:
        return basicMetrics;
    }
  }

  static getInsightsForTier(tier: PackageTier): AnalyticsInsight[] {
    const basicInsights: AnalyticsInsight[] = [
      {
        id: 'compliance_improvement',
        title: 'Compliance Rate Trending Up',
        description: 'Your compliance rate has improved by 2.1% this month, indicating better health management processes.',
        impact: 'medium',
        category: 'compliance',
        tier: 'basic',
        recommendation: 'Continue current practices and monitor monthly trends.'
      }
    ];

    const premiumInsights: AnalyticsInsight[] = [
      {
        id: 'risk_reduction',
        title: 'Risk Alerts Decreased Significantly',
        description: 'AI-powered risk detection shows a 25% reduction in active risk alerts, suggesting improved preventive measures.',
        impact: 'high',
        category: 'risk',
        tier: 'premium',
        recommendation: 'Leverage predictive analytics to maintain this positive trend.'
      },
      {
        id: 'department_performance',
        title: 'Department-Level Insights Available',
        description: 'Advanced analytics reveal performance variations across departments, enabling targeted interventions.',
        impact: 'medium',
        category: 'efficiency',
        tier: 'premium',
        recommendation: 'Focus on underperforming departments identified in the detailed breakdown.'
      }
    ];

    const enterpriseInsights: AnalyticsInsight[] = [
      {
        id: 'competitive_advantage',
        title: 'Above Industry Benchmark',
        description: 'Your organization scores 12% above industry average, indicating strong competitive positioning.',
        impact: 'high',
        category: 'health',
        tier: 'enterprise',
        recommendation: 'Share success metrics in strategic reports to stakeholders.'
      },
      {
        id: 'roi_optimization',
        title: 'Strong Health Investment ROI',
        description: 'Health investments show 23.4% ROI, significantly above typical healthcare ROI benchmarks.',
        impact: 'high',
        category: 'efficiency',
        tier: 'enterprise',
        recommendation: 'Consider scaling successful programs to maximize returns.'
      }
    ];

    switch (tier) {
      case 'basic':
        return basicInsights;
      case 'premium':
        return [...basicInsights, ...premiumInsights];
      case 'enterprise':
        return [...basicInsights, ...premiumInsights, ...enterpriseInsights];
      default:
        return basicInsights;
    }
  }

  static generateReport(tier: PackageTier): AnalyticsReport {
    const metrics = this.getMetricsForTier(tier);
    const insights = this.getInsightsForTier(tier);
    
    const reportTitles = {
      basic: 'Essential Health Overview Report',
      premium: 'Advanced Health Intelligence Report',
      enterprise: 'Strategic Health Command Report'
    };

    const reportDescriptions = {
      basic: 'Comprehensive overview of your essential health metrics and compliance status.',
      premium: 'AI-powered insights with predictive analytics and department-level intelligence.',
      enterprise: 'Strategic intelligence with competitive benchmarking and ROI analysis.'
    };

    return {
      id: `report_${Date.now()}`,
      title: reportTitles[tier],
      description: reportDescriptions[tier],
      metrics,
      insights,
      generatedAt: new Date(),
      tier
    };
  }

  static formatMetricValue(metric: AnalyticsMetric): string {
    const { value, format } = metric;
    
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value}`;
      case 'duration':
        return `${value} days`;
      case 'number':
      default:
        return value.toString();
    }
  }

  static getTrendIcon(trend?: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'TrendingUp';
      case 'down':
        return 'TrendingDown';
      case 'stable':
      default:
        return 'Minus';
    }
  }

  static getTrendColor(trend?: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
      default:
        return 'text-gray-600';
    }
  }
}

export default AnalyticsService;
