import React from 'react';
import { Button, Badge, Card, CardContent, Progress } from '../components/ui';
import { Download } from 'lucide-react';
import { PaddleService } from '../services/paddleService';

const currentPlan = {
  id: 'starter',
  name: 'Starter',
  price: 10,
  conversations: 500,
  used: 320,
  renews: '2024-08-01',
  features: ['All Free features', 'Analytics', 'Custom branding']
};

const invoices = [
  { id: 'inv1', date: '2024-06-01', amount: '$10', status: 'Paid', url: '#' },
  { id: 'inv2', date: '2024-05-01', amount: '$10', status: 'Paid', url: '#' },
];

export default function Billing() {
  const usagePercent = Math.round((currentPlan.used / currentPlan.conversations) * 100);
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Billing & Subscription</h1>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Current Plan</h3>
              <Badge variant="secondary" className="mb-2">{currentPlan.name}</Badge>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                ${currentPlan.price}/mo • {currentPlan.conversations} conversations/mo
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-3">Renews: {currentPlan.renews}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {currentPlan.features.map(f => (
                  <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="primary" 
                  onClick={() => PaddleService.openCheckout('professional')}
                >
                  Upgrade
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => PaddleService.openCheckout('free')}
                >
                  Downgrade
                </Button>
              </div>
            </div>

            {/* Usage */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Usage</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {currentPlan.used} / {currentPlan.conversations} conversations used
              </p>
              <Progress value={usagePercent} className="mb-2" />
              {usagePercent > 90 && (
                <p className="text-red-600 text-sm">You are nearing your conversation limit!</p>
              )}
              <Button 
                variant="ghost" 
                className="mt-4"
                onClick={() => PaddleService.openCustomerPortal('user@email.com')}
              >
                Manage Payment Methods
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invoice History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-sm font-medium text-gray-600 dark:text-gray-300">Date</th>
                  <th className="pb-3 text-sm font-medium text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="pb-3 text-sm font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="pb-3 text-sm font-medium text-gray-600 dark:text-gray-300">Download</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-gray-900 dark:text-white">{inv.date}</td>
                    <td className="py-3 text-gray-900 dark:text-white">{inv.amount}</td>
                    <td className="py-3">
                      <Badge variant={inv.status === 'Paid' ? 'default' : 'secondary'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={inv.url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 