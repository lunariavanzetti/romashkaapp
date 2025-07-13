import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, ArrowRight, Zap, Shield, Clock, Users, CheckCircle, ExternalLink } from 'lucide-react';
import { Button, Badge, AnimatedSpinner } from '../../components/ui';
import { IntegrationProvider, IntegrationType } from '../../types/integrations';

// Mock data for integration providers (in real app, this would come from API)
const mockIntegrationProviders: IntegrationProvider[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    type: 'crm',
    description: 'The world\'s #1 CRM platform. Sync contacts, leads, and deals seamlessly.',
    logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/salesforce.svg',
    website_url: 'https://salesforce.com',
    api_documentation_url: 'https://developer.salesforce.com/docs',
    features: ['Contact Sync', 'Lead Management', 'Deal Tracking', 'Activity Logging', 'Custom Fields'],
    pricing_tier: 'enterprise',
    rating: 4.8,
    review_count: 12847,
    is_popular: true,
    is_featured: true
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    type: 'crm',
    description: 'Powerful CRM with marketing automation. Perfect for growing businesses.',
    logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/hubspot.svg',
    website_url: 'https://hubspot.com',
    api_documentation_url: 'https://developers.hubspot.com',
    features: ['Contact Management', 'Email Marketing', 'Lead Scoring', 'Pipeline Management', 'Automation'],
    pricing_tier: 'free',
    rating: 4.7,
    review_count: 8923,
    is_popular: true,
    is_featured: true
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    type: 'helpdesk',
    description: 'Industry-leading customer service platform. Streamline support ticket workflows.',
    logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/zendesk.svg',
    website_url: 'https://zendesk.com',
    api_documentation_url: 'https://developer.zendesk.com',
    features: ['Ticket Management', 'Knowledge Base', 'Live Chat', 'Customer Satisfaction', 'Reporting'],
    pricing_tier: 'premium',
    rating: 4.6,
    review_count: 15203,
    is_popular: true,
    is_featured: false
  },
  {
    id: 'intercom',
    name: 'Intercom',
    type: 'helpdesk',
    description: 'Modern customer messaging platform. Engage customers throughout their journey.',
    logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/intercom.svg',
    website_url: 'https://intercom.com',
    api_documentation_url: 'https://developers.intercom.com',
    features: ['Live Chat', 'In-app Messaging', 'Customer Data', 'Automation', 'Help Center'],
    pricing_tier: 'premium',
    rating: 4.5,
    review_count: 6742,
    is_popular: false,
    is_featured: true
  },
  {
    id: 'shopify',
    name: 'Shopify',
    type: 'ecommerce',
    description: 'Leading e-commerce platform. Sync orders, customers, and product data.',
    logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/shopify.svg',
    website_url: 'https://shopify.com',
    api_documentation_url: 'https://shopify.dev',
    features: ['Order Sync', 'Customer Data', 'Product Catalog', 'Inventory Management', 'Analytics'],
    pricing_tier: 'basic',
    rating: 4.9,
    review_count: 23456,
    is_popular: true,
    is_featured: true
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    type: 'email_marketing',
    description: 'All-in-one marketing platform. Sync contacts and automate email campaigns.',
    logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mailchimp.svg',
    website_url: 'https://mailchimp.com',
    api_documentation_url: 'https://mailchimp.com/developer',
    features: ['Contact Sync', 'Email Campaigns', 'Automation', 'Landing Pages', 'Analytics'],
    pricing_tier: 'free',
    rating: 4.3,
    review_count: 19832,
    is_popular: true,
    is_featured: false
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    type: 'calendar',
    description: 'Schedule meetings and manage appointments directly from customer conversations.',
    logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/googlecalendar.svg',
    website_url: 'https://calendar.google.com',
    api_documentation_url: 'https://developers.google.com/calendar',
    features: ['Meeting Scheduling', 'Appointment Booking', 'Calendar Sync', 'Availability Check', 'Reminders'],
    pricing_tier: 'free',
    rating: 4.7,
    review_count: 45231,
    is_popular: true,
    is_featured: false
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    type: 'helpdesk',
    description: 'Customer support software that scales with your business needs.',
    logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/freshworks.svg',
    website_url: 'https://freshdesk.com',
    api_documentation_url: 'https://developers.freshdesk.com',
    features: ['Ticket Management', 'Multi-channel Support', 'Automation', 'Time Tracking', 'SLA Management'],
    pricing_tier: 'basic',
    rating: 4.4,
    review_count: 7891,
    is_popular: false,
    is_featured: false
  }
];

const integrationTypeLabels: Record<IntegrationType, string> = {
  crm: 'CRM',
  helpdesk: 'Help Desk',
  ecommerce: 'E-commerce',
  email_marketing: 'Email Marketing',
  calendar: 'Calendar',
  analytics: 'Analytics'
};

const pricingTierColors = {
  free: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  basic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
};

interface IntegrationMarketplaceProps {
  onSetupIntegration: (provider: IntegrationProvider) => void;
}

export default function IntegrationMarketplace({ onSetupIntegration }: IntegrationMarketplaceProps) {
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<IntegrationType | 'all'>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'name'>('popular');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProviders(mockIntegrationProviders);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredProviders = providers
    .filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || provider.type === selectedType;
      const matchesPricing = selectedPricing === 'all' || provider.pricing_tier === selectedPricing;
      return matchesSearch && matchesType && matchesPricing;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popular':
        default:
          if (a.is_popular && !b.is_popular) return -1;
          if (!a.is_popular && b.is_popular) return 1;
          return b.review_count - a.review_count;
      }
    });

  const featuredProviders = providers.filter(p => p.is_featured);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <AnimatedSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
            Integration Marketplace
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Connect ROMASHKA with your favorite tools and platforms. 200+ integrations available.
        </p>
      </motion.div>

      {/* Featured Integrations */}
      {featuredProviders.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-4">
            Featured Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProviders.slice(0, 6).map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass hover:shadow-elevation-2 transition-all cursor-pointer"
                onClick={() => onSetupIntegration(provider)}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center shadow-sm">
                    <img src={provider.logo_url} alt={provider.name} className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
                    <Badge variant="secondary">
                      {integrationTypeLabels[provider.type]}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {provider.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{provider.rating}</span>
                    <span className="text-xs text-gray-500">({provider.review_count.toLocaleString()})</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Setup <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as IntegrationType | 'all')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal"
            >
              <option value="all">All Types</option>
              {Object.entries(integrationTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={selectedPricing}
              onChange={(e) => setSelectedPricing(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal"
            >
              <option value="all">All Pricing</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Provider Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredProviders.map((provider, index) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass hover:shadow-elevation-2 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center shadow-sm">
                  <img src={provider.logo_url} alt={provider.name} className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {provider.name}
                    {provider.is_popular && (
                      <Badge variant="default">Popular</Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {integrationTypeLabels[provider.type]}
                    </Badge>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${pricingTierColors[provider.pricing_tier]}`}>
                      {provider.pricing_tier}
                    </span>
                  </div>
                </div>
              </div>
              <a
                href={provider.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {provider.description}
            </p>

            {/* Features */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Features</h4>
              <div className="flex flex-wrap gap-1">
                {provider.features.slice(0, 3).map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300"
                  >
                    {feature}
                  </span>
                ))}
                {provider.features.length > 3 && (
                  <span className="text-xs text-gray-500">+{provider.features.length - 3} more</span>
                )}
              </div>
            </div>

            {/* Rating and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{provider.rating}</span>
                <span className="text-xs text-gray-500">({provider.review_count.toLocaleString()})</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSetupIntegration(provider)}
              >
                Setup Integration
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredProviders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No integrations found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try adjusting your search criteria or filters to find more integrations.
          </p>
        </motion.div>
      )}
    </div>
  );
}