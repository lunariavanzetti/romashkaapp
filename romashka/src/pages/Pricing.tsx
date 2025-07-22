import React, { useState } from 'react';
import { Button, Switch, Card, CardContent } from '../components/ui';
import { Info } from 'lucide-react';
import { PaddleService } from '../services/paddleService';

const pricingPlans = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    conversations: 50,
    features: ['Basic AI responses', 'Website widget', 'Email support']
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 10,
    conversations: 500,
    features: ['All Free features', 'Analytics', 'Custom branding']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 29,
    conversations: 2000,
    features: ['All Starter features', 'Multi-channel', 'API access']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 50,
    conversations: 'unlimited',
    features: ['All Pro features', 'White-label', 'Priority support']
  }
];

const featureExplanations: Record<string, string> = {
  'Basic AI responses': 'Get automated answers to common questions.',
  'Website widget': 'Embed the chat widget on your website.',
  'Email support': 'Get help via email.',
  'Analytics': 'Access to analytics dashboard.',
  'Custom branding': 'Add your logo and colors.',
  'Multi-channel': 'Support for WhatsApp, Messenger, and more.',
  'API access': 'Integrate with your own systems.',
  'White-label': 'Remove ROMASHKA branding.',
  'Priority support': 'Get help faster from our team.'
};

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const getPrice = (plan: typeof pricingPlans[number]) => {
    if (plan.price === 0) return 'Free';
    if (annual) return `$${(plan.price * 10).toFixed(0)}/yr`;
    return `$${plan.price}/mo`;
  };
  const getSavings = (plan: typeof pricingPlans[number]) => {
    if (plan.price === 0) return null;
    return `Save $${(plan.price * 2).toFixed(0)}/yr`;
  };
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Pricing Plans</h1>
      
      <div className="flex items-center gap-2 mb-6">
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <span className="text-gray-700 dark:text-gray-300">
          Annual billing <span className="text-primary-teal font-semibold">(save 2 months)</span>
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {pricingPlans.map(plan => (
          <Card key={plan.id} className="text-center relative">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-primary-teal mb-2">{getPrice(plan)}</div>
              {annual && plan.price > 0 && (
                <p className="text-green-600 text-sm mb-2">{getSavings(plan)}</p>
              )}
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {plan.conversations} conversations/mo
              </p>
              
              <div className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center justify-center gap-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
                    {featureExplanations[f] && (
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          {featureExplanations[f]}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                variant={plan.price === 0 ? 'outline' : 'primary'}
                className="w-full mb-2"
                onClick={() => PaddleService.openCheckout(plan.id)}
                disabled={plan.price === 0}
              >
                {plan.price === 0 ? 'Start Free Trial' : 'Choose Plan'}
              </Button>
              
              {plan.id === 'enterprise' && (
                <Button variant="ghost" className="w-full text-sm">
                  Contact Sales
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <p className="text-center text-gray-600 dark:text-gray-300">
        Pricing plans available for all features
      </p>
    </div>
  );
} 