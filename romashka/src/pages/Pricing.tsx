import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Tooltip, Switch, FormControlLabel } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Pricing Plans</Typography>
      <FormControlLabel
        control={<Switch checked={annual} onChange={() => setAnnual(a => !a)} />}
        label={<span>Annual billing <span style={{ color: '#4ECDC4', fontWeight: 600 }}>(save 2 months)</span></span>}
        sx={{ mb: 3 }}
      />
      <Grid container spacing={3}>
        {pricingPlans.map(plan => (
          <Grid item xs={12} md={3} key={plan.id}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', position: 'relative' }}>
              <Typography variant="h6" fontWeight={700} mb={1}>{plan.name}</Typography>
              <Typography variant="h4" color="primary" mb={1}>{getPrice(plan)}</Typography>
              {annual && plan.price > 0 && <Typography variant="body2" color="success.main">{getSavings(plan)}</Typography>}
              <Typography variant="body2" mb={2}>{plan.conversations} conversations/mo</Typography>
              <Box sx={{ mb: 2 }}>
                {plan.features.map(f => (
                  <Box key={f} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                    <span>{f}</span>
                    {featureExplanations[f] && (
                      <Tooltip title={featureExplanations[f]}><InfoOutlined fontSize="small" sx={{ ml: 0.5 }} /></Tooltip>
                    )}
                  </Box>
                ))}
              </Box>
              <Button
                variant={plan.price === 0 ? 'outlined' : 'contained'}
                color="primary"
                fullWidth
                onClick={() => PaddleService.openCheckout(plan.id)}
                disabled={plan.price === 0}
              >
                {plan.price === 0 ? 'Start Free Trial' : 'Choose Plan'}
              </Button>
              {plan.id === 'enterprise' && <Button variant="text" color="secondary" fullWidth sx={{ mt: 1 }}>Contact Sales</Button>}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 