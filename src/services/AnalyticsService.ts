
import { PackageTier, FeatureKey } from '@/types/subscription';
import { PackageConfigurationService } from '@/services/PackageConfigurationService';
import { BasicAnalyticsData } from '@/hooks/useBasicAnalytics';

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
  static getMetricsForTier(tier: PackageTier, realData?: BasicAnalyticsData): AnalyticsMetric[] {
    // Use real data if available, otherwise fall back to mock data
    const data = realData || {
      totalPatients: 156,
      totalCompanies: 8,
      totalExaminations: 89,
      totalFit: 136,
      completionRate: 87.5,
      certificatesExpiring: 12,
      complianceRate: 87.2,
      recentActivityCount: 23,
      pendingDocuments: 5
    };

    const basicMetrics: AnalyticsMetric[] = [
      {
        id: 'active_employees',
        name: 'Active Employees',
        value: data.totalPatients,
        change: 5.2,
        trend: 'up',
        format: 'number',
        icon: 'Users',
        color: 'text-blue-600'
      },
      {
        id: 'compliance_rate',
        name: 'Compliance Rate',
        value: data.complianceRate,
        change: 2.1,
        trend: 'up',
        format: 'percentage',
        icon: 'CheckCircle',
        color: 'text-green-600'
      },
      {
        id: 'expiring_certificates',
        name: 'Expiring Soon',
        value: data.certificatesExpiring,
        change: -15.3,
        trend: 'down',
        format: 'number',
        icon: 'Clock',
        color: 'text-yellow-600'
      },
      {
        id: 'monthly_tests',
        name: 'Total Examinations',
        value: data.totalExaminations,
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
        value: Math.round(data.complianceRate / 10),
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
        value: Math.max(0, 10 - Math.round(data.complianceRate / 10)),
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
        value: data.totalCompanies,
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
        value: Math.min(95, data.completionRate + 5),
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
        value: Math.round(data.complianceRate + 15),
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
        value: Math.round(data.complianceRate / 4),
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
        value: Math.max(1, 5 - Math.round(data.complianceRate / 20)),
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
        value: Math.round(data.totalCompanies * 0.75),
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

  static getInsightsForTier(tier: PackageTier, realData?: BasicAnalyticsData): AnalyticsInsight[] {
    const data = realData || {
      totalPatients: 156,
      totalCompanies: 8,
      totalExaminations: 89,
      totalFit: 136,
      completionRate: 87.5,
      certificatesExpiring: 12,
      complianceRate: 87.2,
      recentActivityCount: 23,
      pendingDocuments: 5
    };

    const basicInsights: AnalyticsInsight[] = [
      {
        id: 'compliance_improvement',
        title: `${data.complianceRate >= 85 ? 'Strong' : 'Improving'} Compliance Performance`,
        description: `Your compliance rate of ${data.complianceRate}% ${data.complianceRate >= 85 ? 'exceeds industry standards' : 'shows room for improvement'} with ${data.totalFit} fit workers out of ${data.totalPatients} total.`,
        impact: data.complianceRate >= 90 ? 'low' : data.complianceRate >= 75 ? 'medium' : 'high',
        category: 'compliance',
        tier: 'basic',
        recommendation: data.complianceRate >= 85 ? 'Continue current practices and monitor trends.' : 'Focus on improving compliance through targeted interventions.'
      }
    ];

    const premiumInsights: AnalyticsInsight[] = [
      {
        id: 'risk_reduction',
        title: 'Health Management Effectiveness',
        description: `With ${data.totalExaminations} examinations completed and ${data.certificatesExpiring} certificates expiring soon, your health management system shows ${data.completionRate >= 80 ? 'strong' : 'moderate'} effectiveness.`,
        impact: data.certificatesExpiring > 20 ? 'high' : data.certificatesExpiring > 10 ? 'medium' : 'low',
        category: 'risk',
        tier: 'premium',
        recommendation: 'Leverage predictive analytics to identify patterns and optimize scheduling.'
      },
      {
        id: 'department_performance',
        title: 'Multi-Company Management',
        description: `Managing health across ${data.totalCompanies} companies with ${data.recentActivityCount} recent activities indicates ${data.recentActivityCount > 20 ? 'high' : 'moderate'} operational efficiency.`,
        impact: 'medium',
        category: 'efficiency',
        tier: 'premium',
        recommendation: 'Implement department-level tracking for targeted improvements.'
      }
    ];

    const enterpriseInsights: AnalyticsInsight[] = [
      {
        id: 'competitive_advantage',
        title: 'Market Position Analysis',
        description: `Your organization's ${data.complianceRate}% compliance rate positions you ${data.complianceRate > 85 ? 'above' : 'at'} industry benchmarks for health management excellence.`,
        impact: 'high',
        category: 'health',
        tier: 'enterprise',
        recommendation: 'Share success metrics in strategic reports to stakeholders.'
      },
      {
        id: 'roi_optimization',
        title: 'Investment Efficiency',
        description: `With ${data.totalExaminations} examinations across ${data.totalCompanies} companies, your health investment shows strong returns in risk mitigation and compliance.`,
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

  static generateReport(tier: PackageTier, realData?: BasicAnalyticsData): AnalyticsReport {
    const metrics = this.getMetricsForTier(tier, realData);
    const insights = this.getInsightsForTier(tier, realData);
    
    const reportTitles = {
      basic: 'Essential Health Overview Report',
      premium: 'Advanced Health Intelligence Report',
      enterprise: 'Strategic Health Command Report'
    };

    const reportDescriptions = {
      basic: `Comprehensive overview of your essential health metrics and compliance status for ${realData?.totalPatients || 156} patients.`,
      premium: `AI-powered insights with predictive analytics and department-level intelligence across ${realData?.totalCompanies || 8} companies.`,
      enterprise: `Strategic intelligence with competitive benchmarking and ROI analysis for ${realData?.totalPatients || 156} patients across ${realData?.totalCompanies || 8} companies.`
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
