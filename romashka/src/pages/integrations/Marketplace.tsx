import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CogIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  ShoppingCartIcon,
  EnvelopeIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import type { 
  IntegrationProvider, 
  IntegrationType, 
  Integration 
} from '../../types/integrations';

const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    type: 'crm',
    description: 'World\'s #1 CRM platform for managing contacts, leads, deals, and sales pipeline with advanced automation.',
    logo_url: '/integrations/salesforce-logo.svg',
    website_url: 'https://salesforce.com',
    api_documentation_url: 'https://developer.salesforce.com',
    features: ['Contact Management', 'Lead Scoring', 'Pipeline Management', 'Sales Automation', 'Custom Fields', 'Reports & Analytics'],
    pricing_tier: 'premium',
    rating: 4.8,
    review_count: 12847,
    is_popular: true,
    is_featured: true
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    type: 'crm',
    description: 'All-in-one CRM, marketing, and sales platform with powerful automation and customer journey tracking.',
    logo_url: '/integrations/hubspot-logo.svg',
    website_url: 'https://hubspot.com',
    api_documentation_url: 'https://developers.hubspot.com',
    features: ['Contact Management', 'Deal Pipeline', 'Email Marketing', 'Landing Pages', 'Marketing Automation', 'Analytics'],
    pricing_tier: 'basic',
    rating: 4.6,
    review_count: 8432,
    is_popular: true,
    is_featured: true
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    type: 'crm',
    description: 'Simple and effective sales CRM designed for small to medium businesses with visual pipeline management.',
    logo_url: '/integrations/pipedrive-logo.svg',
    website_url: 'https://pipedrive.com',
    api_documentation_url: 'https://developers.pipedrive.com',
    features: ['Visual Pipeline', 'Activity Management', 'Sales Reporting', 'Email Integration', 'Mobile App', 'Workflow Automation'],
    pricing_tier: 'basic',
    rating: 4.5,
    review_count: 3214,
    is_popular: true,
    is_featured: false
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    type: 'helpdesk',
    description: 'Customer service platform with ticketing, knowledge base, and multi-channel support capabilities.',
    logo_url: '/integrations/zendesk-logo.svg',
    website_url: 'https://zendesk.com',
    api_documentation_url: 'https://developer.zendesk.com',
    features: ['Ticket Management', 'Knowledge Base', 'Live Chat', 'Multi-channel Support', 'Automation Rules', 'Customer Portal'],
    pricing_tier: 'premium',
    rating: 4.4,
    review_count: 9876,
    is_popular: true,
    is_featured: true
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    type: 'helpdesk',
    description: 'Modern helpdesk software with AI-powered automation and omnichannel customer support.',
    logo_url: '/integrations/freshdesk-logo.svg',
    website_url: 'https://freshdesk.com',
    api_documentation_url: 'https://developers.freshdesk.com',
    features: ['Smart Ticketing', 'AI Assistant', 'Community Forums', 'Time Tracking', 'SLA Management', 'Mobile Support'],
    pricing_tier: 'basic',
    rating: 4.3,
    review_count: 5432,
    is_popular: false,
    is_featured: false
  },
  {
    id: 'intercom',
    name: 'Intercom',
    type: 'helpdesk',
    description: 'Conversational customer support platform with live chat, bots, and customer messaging.',
    logo_url: '/integrations/intercom-logo.svg',
    website_url: 'https://intercom.com',
    api_documentation_url: 'https://developers.intercom.com',
    features: ['Live Messenger', 'Chatbots', 'Help Center', 'Product Tours', 'Customer Health Score', 'A/B Testing'],
    pricing_tier: 'premium',
    rating: 4.2,
    review_count: 4123,
    is_popular: false,
    is_featured: true
  },
  {
    id: 'shopify',
    name: 'Shopify',
    type: 'ecommerce',
    description: 'Leading e-commerce platform for online stores with comprehensive order and inventory management.',
    logo_url: '/integrations/shopify-logo.svg',
    website_url: 'https://shopify.com',
    api_documentation_url: 'https://shopify.dev',
    features: ['Order Management', 'Inventory Sync', 'Customer Profiles', 'Product Catalog', 'Payment Processing', 'Analytics'],
    pricing_tier: 'basic',
    rating: 4.7,
    review_count: 15647,
    is_popular: true,
    is_featured: true
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    type: 'ecommerce',
    description: 'WordPress-based e-commerce solution with flexible customization and extensive plugin ecosystem.',
    logo_url: '/integrations/woocommerce-logo.svg',
    website_url: 'https://woocommerce.com',
    api_documentation_url: 'https://woocommerce.github.io/woocommerce-rest-api-docs',
    features: ['Product Management', 'Order Processing', 'Payment Gateways', 'Shipping Options', 'Tax Management', 'Reports'],
    pricing_tier: 'free',
    rating: 4.1,
    review_count: 8765,
    is_popular: true,
    is_featured: false
  }
];

const CATEGORY_ICONS = {
  crm: BuildingOfficeIcon,
  helpdesk: PhoneIcon,
  ecommerce: ShoppingCartIcon,
  email_marketing: EnvelopeIcon,
  calendar: CalendarIcon,
  analytics: ChartBarIcon
};

const PRICING_COLORS = {
  free: 'text-green-600 bg-green-50',
  basic: 'text-blue-600 bg-blue-50',
  premium: 'text-purple-600 bg-purple-50',
  enterprise: 'text-gray-900 bg-gray-100'
};

interface MarketplaceProps {
  onInstallIntegration: (providerId: string) => void;
  installedIntegrations: Integration[];
}

export default function Marketplace({ onInstallIntegration, installedIntegrations }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntegrationType | 'all'>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'name'>('popularity');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

  const installedProviderIds = useMemo(() => 
    new Set(installedIntegrations.map(integration => integration.provider)),
    [installedIntegrations]
  );

  const filteredProviders = useMemo(() => {
    let filtered = INTEGRATION_PROVIDERS.filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           provider.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           provider.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || provider.type === selectedCategory;
      const matchesPricing = selectedPricing === 'all' || provider.pricing_tier === selectedPricing;
      
      return matchesSearch && matchesCategory && matchesPricing;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
        default:
          return (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0) || b.review_count - a.review_count;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedPricing, sortBy]);

  const categories = [
    { id: 'all' as const, name: 'All Categories', count: INTEGRATION_PROVIDERS.length },
    { id: 'crm' as const, name: 'CRM', count: INTEGRATION_PROVIDERS.filter(p => p.type === 'crm').length },
    { id: 'helpdesk' as const, name: 'Help Desk', count: INTEGRATION_PROVIDERS.filter(p => p.type === 'helpdesk').length },
    { id: 'ecommerce' as const, name: 'E-commerce', count: INTEGRATION_PROVIDERS.filter(p => p.type === 'ecommerce').length },
    { id: 'email_marketing' as const, name: 'Email Marketing', count: INTEGRATION_PROVIDERS.filter(p => p.type === 'email_marketing').length },
    { id: 'calendar' as const, name: 'Calendar', count: INTEGRATION_PROVIDERS.filter(p => p.type === 'calendar').length },
    { id: 'analytics' as const, name: 'Analytics', count: INTEGRATION_PROVIDERS.filter(p => p.type === 'analytics').length }
  ];

  const handleInstall = (provider: IntegrationProvider) => {
    onInstallIntegration(provider.id);
    setSelectedProvider(null);
  };

  const isInstalled = (providerId: string) => installedProviderIds.has(providerId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Integration Marketplace
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              Connect ROMASHKA with your favorite tools and platforms
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="popularity">Sort by Popularity</option>
              <option value="rating">Sort by Rating</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center">
                          <input
                            type="radio"
                            name="category"
                            value={category.id}
                            checked={selectedCategory === category.id}
                            onChange={(e) => setSelectedCategory(e.target.value as any)}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {category.name} ({category.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pricing
                    </label>
                    <div className="space-y-2">
                      {['all', 'free', 'basic', 'premium', 'enterprise'].map(pricing => (
                        <label key={pricing} className="flex items-center">
                          <input
                            type="radio"
                            name="pricing"
                            value={pricing}
                            checked={selectedPricing === pricing}
                            onChange={(e) => setSelectedPricing(e.target.value)}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {pricing === 'all' ? 'All Pricing' : pricing}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredProviders.length} of {INTEGRATION_PROVIDERS.length} integrations
          </p>
        </div>

        {/* Featured Integrations */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Featured Integrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INTEGRATION_PROVIDERS.filter(p => p.is_featured).map(provider => (
                <IntegrationCard
                  key={provider.id}
                  provider={provider}
                  isInstalled={isInstalled(provider.id)}
                  onInstall={() => handleInstall(provider)}
                  onViewDetails={() => setSelectedProvider(provider)}
                  featured
                />
              ))}
            </div>
          </div>
        )}

        {/* All Integrations */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {searchQuery ? 'Search Results' : 'All Integrations'}
          </h2>
          
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <BuildingOfficeIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No integrations found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProviders.map(provider => (
                <IntegrationCard
                  key={provider.id}
                  provider={provider}
                  isInstalled={isInstalled(provider.id)}
                  onInstall={() => handleInstall(provider)}
                  onViewDetails={() => setSelectedProvider(provider)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Provider Details Modal */}
      <AnimatePresence>
        {selectedProvider && (
          <ProviderDetailsModal
            provider={selectedProvider}
            isInstalled={isInstalled(selectedProvider.id)}
            onClose={() => setSelectedProvider(null)}
            onInstall={() => handleInstall(selectedProvider)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface IntegrationCardProps {
  provider: IntegrationProvider;
  isInstalled: boolean;
  onInstall: () => void;
  onViewDetails: () => void;
  featured?: boolean;
}

function IntegrationCard({ provider, isInstalled, onInstall, onViewDetails, featured = false }: IntegrationCardProps) {
  const IconComponent = CATEGORY_ICONS[provider.type];
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
        shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
        ${featured ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}
      `}
    >
      {featured && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium px-3 py-1 text-center">
          Featured
        </div>
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${PRICING_COLORS[provider.pricing_tier]}`}>
                {provider.pricing_tier}
              </span>
            </div>
          </div>
          
          {isInstalled && (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {provider.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarSolid
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(provider.rating) 
                    ? 'text-yellow-400' 
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {provider.rating} ({provider.review_count.toLocaleString()})
          </span>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {provider.features.slice(0, 3).map(feature => (
              <span
                key={feature}
                className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
              >
                {feature}
              </span>
            ))}
            {provider.features.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{provider.features.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View Details
          </button>
          
          {isInstalled ? (
            <button
              className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg cursor-default"
              disabled
            >
              <CheckCircleIcon className="h-4 w-4 inline mr-1" />
              Installed
            </button>
          ) : (
            <button
              onClick={onInstall}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 inline mr-1" />
              Install
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ProviderDetailsModalProps {
  provider: IntegrationProvider;
  isInstalled: boolean;
  onClose: () => void;
  onInstall: () => void;
}

function ProviderDetailsModal({ provider, isInstalled, onClose, onInstall }: ProviderDetailsModalProps) {
  const IconComponent = CATEGORY_ICONS[provider.type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <IconComponent className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{provider.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${PRICING_COLORS[provider.pricing_tier]}`}>
                    {provider.pricing_tier}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">{provider.type}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h3>
            <p className="text-gray-600 dark:text-gray-400">{provider.description}</p>
          </div>

          {/* Rating & Reviews */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rating & Reviews</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarSolid
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(provider.rating) 
                          ? 'text-yellow-400' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {provider.rating}
                </span>
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                {provider.review_count.toLocaleString()} reviews
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {provider.features.map(feature => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Resources</h3>
            <div className="space-y-2">
              <a
                href={provider.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowRightIcon className="h-4 w-4" />
                Visit Website
              </a>
              <a
                href={provider.api_documentation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowRightIcon className="h-4 w-4" />
                API Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            
            {isInstalled ? (
              <button
                className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg cursor-default"
                disabled
              >
                <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                Installed
              </button>
            ) : (
              <button
                onClick={onInstall}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 inline mr-2" />
                Install Integration
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}