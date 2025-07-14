// ROI Calculations Types
export interface ROICalculation {
  id: string;
  user_id: string;
  calculation_name: string;
  description: string;
  period_start: string;
  period_end: string;
  metrics: ROIMetrics;
  costs: ROICosts;
  revenue: ROIRevenue;
  calculated_roi: number;
  roi_percentage: number;
  payback_period_months: number;
  calculation_method: 'standard' | 'custom';
  custom_formula?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ROIMetrics {
  // Website & Traffic Metrics
  website_traffic: {
    unique_visitors: number;
    page_views: number;
    session_duration: number;
    bounce_rate: number;
  };
  
  // Lead Generation Metrics
  lead_generation: {
    total_leads: number;
    qualified_leads: number;
    lead_quality_score: number;
    cost_per_lead: number;
  };
  
  // Conversion Metrics
  conversions: {
    total_conversions: number;
    conversion_rate: number;
    avg_order_value: number;
    customer_lifetime_value: number;
  };
  
  // Engagement Metrics
  engagement: {
    chat_sessions: number;
    email_opens: number;
    email_clicks: number;
    social_shares: number;
  };
  
  // Support Metrics
  support: {
    tickets_resolved: number;
    avg_resolution_time: number;
    customer_satisfaction: number;
    automation_rate: number;
  };
}

export interface ROICosts {
  // Platform & Software Costs
  platform_costs: {
    romashka_subscription: number;
    integrations: number;
    additional_tools: number;
  };
  
  // Marketing Costs
  marketing_costs: {
    advertising_spend: number;
    content_creation: number;
    email_marketing: number;
    social_media: number;
  };
  
  // Personnel Costs
  personnel_costs: {
    staff_salaries: number;
    training_costs: number;
    contractor_fees: number;
  };
  
  // Implementation Costs
  implementation_costs: {
    setup_costs: number;
    customization: number;
    consulting: number;
  };
  
  // Operational Costs
  operational_costs: {
    hosting: number;
    maintenance: number;
    support: number;
  };
}

export interface ROIRevenue {
  // Direct Revenue
  direct_revenue: {
    sales_revenue: number;
    subscription_revenue: number;
    service_revenue: number;
  };
  
  // Indirect Revenue
  indirect_revenue: {
    upsells: number;
    cross_sells: number;
    renewals: number;
  };
  
  // Cost Savings
  cost_savings: {
    support_automation: number;
    lead_qualification: number;
    time_savings: number;
    process_efficiency: number;
  };
  
  // Value Attribution
  attribution: {
    romashka_attributed: number;
    other_channels: number;
    organic: number;
  };
}

export interface ROITemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  business_type: 'b2b' | 'b2c' | 'saas' | 'ecommerce' | 'service';
  metrics_config: Partial<ROIMetrics>;
  costs_config: Partial<ROICosts>;
  revenue_config: Partial<ROIRevenue>;
  calculation_method: 'standard' | 'custom';
  custom_formula?: string;
  recommended_period: number; // months
}

export interface ROIComparison {
  id: string;
  user_id: string;
  comparison_name: string;
  periods: ROICalculation[];
  analysis: {
    trend: 'improving' | 'declining' | 'stable';
    trend_percentage: number;
    best_performing_period: string;
    worst_performing_period: string;
    key_insights: string[];
  };
  created_at: string;
}

export interface ROIForecasting {
  id: string;
  user_id: string;
  forecast_name: string;
  base_calculation: string; // ROI calculation ID
  forecast_period_months: number;
  assumptions: {
    growth_rate: number;
    cost_inflation: number;
    market_changes: number;
    seasonal_factors: number[];
  };
  projected_metrics: ROIMetrics;
  projected_costs: ROICosts;
  projected_revenue: ROIRevenue;
  projected_roi: number;
  confidence_level: number;
  created_at: string;
}

export interface ROIBenchmark {
  industry: string;
  business_type: string;
  company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  benchmarks: {
    avg_roi: number;
    top_quartile_roi: number;
    median_roi: number;
    avg_payback_period: number;
    conversion_rate: number;
    cost_per_lead: number;
    customer_lifetime_value: number;
  };
}

export interface ROIAlert {
  id: string;
  user_id: string;
  alert_name: string;
  alert_type: 'roi_drop' | 'cost_spike' | 'revenue_drop' | 'metric_threshold';
  threshold_value: number;
  current_value: number;
  triggered_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendations: string[];
  resolved: boolean;
  created_at: string;
}

export const ROI_CALCULATION_METHODS = {
  standard: {
    name: 'Standard ROI',
    formula: '(Revenue - Cost) / Cost * 100',
    description: 'Traditional ROI calculation'
  },
  marketing: {
    name: 'Marketing ROI',
    formula: '(Revenue - Marketing Cost) / Marketing Cost * 100',
    description: 'ROI focused on marketing investments'
  },
  customer_acquisition: {
    name: 'Customer Acquisition ROI',
    formula: '(CLV - CAC) / CAC * 100',
    description: 'ROI based on customer lifetime value vs acquisition cost'
  },
  time_based: {
    name: 'Time-Based ROI',
    formula: '(Annual Revenue - Annual Cost) / Annual Cost * 100',
    description: 'ROI calculated on an annual basis'
  },
  custom: {
    name: 'Custom Formula',
    formula: 'User-defined',
    description: 'Custom ROI calculation formula'
  }
};

export const ROI_TEMPLATES: ROITemplate[] = [
  {
    id: 'saas_startup',
    name: 'SaaS Startup',
    description: 'ROI calculation template for SaaS startups',
    industry: 'Software',
    business_type: 'saas',
    metrics_config: {
      lead_generation: {
        total_leads: 0,
        qualified_leads: 0,
        lead_quality_score: 0,
        cost_per_lead: 0
      },
      conversions: {
        total_conversions: 0,
        conversion_rate: 0,
        avg_order_value: 0,
        customer_lifetime_value: 0
      }
    },
    costs_config: {
      platform_costs: {
        romashka_subscription: 0,
        integrations: 0,
        additional_tools: 0
      },
      marketing_costs: {
        advertising_spend: 0,
        content_creation: 0,
        email_marketing: 0,
        social_media: 0
      }
    },
    revenue_config: {
      direct_revenue: {
        sales_revenue: 0,
        subscription_revenue: 0,
        service_revenue: 0
      },
      cost_savings: {
        support_automation: 0,
        lead_qualification: 0,
        time_savings: 0,
        process_efficiency: 0
      }
    },
    calculation_method: 'standard',
    recommended_period: 12
  },
  {
    id: 'ecommerce_business',
    name: 'E-commerce Business',
    description: 'ROI calculation template for e-commerce businesses',
    industry: 'E-commerce',
    business_type: 'ecommerce',
    metrics_config: {
      website_traffic: {
        unique_visitors: 0,
        page_views: 0,
        session_duration: 0,
        bounce_rate: 0
      },
      conversions: {
        total_conversions: 0,
        conversion_rate: 0,
        avg_order_value: 0,
        customer_lifetime_value: 0
      }
    },
    costs_config: {
      platform_costs: {
        romashka_subscription: 0,
        integrations: 0,
        additional_tools: 0
      },
      marketing_costs: {
        advertising_spend: 0,
        content_creation: 0,
        email_marketing: 0,
        social_media: 0
      }
    },
    revenue_config: {
      direct_revenue: {
        sales_revenue: 0,
        subscription_revenue: 0,
        service_revenue: 0
      },
      indirect_revenue: {
        upsells: 0,
        cross_sells: 0,
        renewals: 0
      }
    },
    calculation_method: 'standard',
    recommended_period: 6
  },
  {
    id: 'service_business',
    name: 'Service Business',
    description: 'ROI calculation template for service businesses',
    industry: 'Services',
    business_type: 'service',
    metrics_config: {
      lead_generation: {
        total_leads: 0,
        qualified_leads: 0,
        lead_quality_score: 0,
        cost_per_lead: 0
      },
      support: {
        tickets_resolved: 0,
        avg_resolution_time: 0,
        customer_satisfaction: 0,
        automation_rate: 0
      }
    },
    costs_config: {
      platform_costs: {
        romashka_subscription: 0,
        integrations: 0,
        additional_tools: 0
      },
      personnel_costs: {
        staff_salaries: 0,
        training_costs: 0,
        contractor_fees: 0
      }
    },
    revenue_config: {
      direct_revenue: {
        sales_revenue: 0,
        subscription_revenue: 0,
        service_revenue: 0
      },
      cost_savings: {
        support_automation: 0,
        lead_qualification: 0,
        time_savings: 0,
        process_efficiency: 0
      }
    },
    calculation_method: 'standard',
    recommended_period: 12
  }
];

export const INDUSTRY_BENCHMARKS: Record<string, ROIBenchmark> = {
  'software_saas': {
    industry: 'Software/SaaS',
    business_type: 'saas',
    company_size: 'medium',
    benchmarks: {
      avg_roi: 300,
      top_quartile_roi: 500,
      median_roi: 250,
      avg_payback_period: 18,
      conversion_rate: 2.5,
      cost_per_lead: 50,
      customer_lifetime_value: 2500
    }
  },
  'ecommerce': {
    industry: 'E-commerce',
    business_type: 'ecommerce',
    company_size: 'medium',
    benchmarks: {
      avg_roi: 400,
      top_quartile_roi: 600,
      median_roi: 350,
      avg_payback_period: 12,
      conversion_rate: 3.2,
      cost_per_lead: 25,
      customer_lifetime_value: 500
    }
  },
  'services': {
    industry: 'Services',
    business_type: 'service',
    company_size: 'medium',
    benchmarks: {
      avg_roi: 250,
      top_quartile_roi: 400,
      median_roi: 200,
      avg_payback_period: 24,
      conversion_rate: 5.0,
      cost_per_lead: 75,
      customer_lifetime_value: 5000
    }
  }
};

export interface ROIInsight {
  type: 'positive' | 'negative' | 'neutral';
  category: 'performance' | 'cost' | 'revenue' | 'efficiency';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  confidence: number;
}

export interface ROIReport {
  id: string;
  user_id: string;
  report_name: string;
  calculation_id: string;
  report_type: 'standard' | 'executive' | 'detailed' | 'comparison';
  generated_at: string;
  period_covered: {
    start: string;
    end: string;
  };
  executive_summary: {
    roi_percentage: number;
    total_revenue: number;
    total_costs: number;
    payback_period: number;
    key_highlights: string[];
  };
  insights: ROIInsight[];
  charts_data: {
    roi_trend: Array<{ date: string; value: number }>;
    cost_breakdown: Array<{ category: string; value: number }>;
    revenue_sources: Array<{ source: string; value: number }>;
    performance_metrics: Array<{ metric: string; value: number; benchmark: number }>;
  };
  recommendations: string[];
  next_steps: string[];
}