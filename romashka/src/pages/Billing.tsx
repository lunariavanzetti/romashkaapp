import React from 'react';
import { Box, Typography, Paper, Grid, Button, LinearProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Billing & Subscription</Typography>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        {/* Temporarily commented out for build fix
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" mb={1}>Current Plan</Typography>
            <Chip label={currentPlan.name} color="primary" sx={{ mb: 1 }} />
            <Typography variant="body2" mb={1}>${currentPlan.price}/mo • {currentPlan.conversations} conversations/mo</Typography>
            <Typography variant="body2" mb={1}>Renews: {currentPlan.renews}</Typography>
            <Box sx={{ mb: 2 }}>
              {currentPlan.features.map(f => <Chip key={f} label={f} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}
            </Box>
            <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={() => PaddleService.openCheckout('professional')}>Upgrade</Button>
            <Button variant="outlined" color="secondary" onClick={() => PaddleService.openCheckout('free')}>Downgrade</Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" mb={1}>Usage</Typography>
            <Typography variant="body2" mb={1}>{currentPlan.used} / {currentPlan.conversations} conversations used</Typography>
            <LinearProgress variant="determinate" value={usagePercent} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
            {usagePercent > 90 && <Typography color="error">You are nearing your conversation limit!</Typography>}
            <Button variant="text" color="primary" sx={{ mt: 2 }} onClick={() => PaddleService.openCustomerPortal('user@email.com')}>Manage Payment Methods</Button>
          </Grid>
        </Grid>
        */}
      </Paper>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" mb={2}>Invoice History</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Download</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell>{inv.amount}</TableCell>
                  <TableCell>{inv.status}</TableCell>
                  <TableCell><Button href={inv.url} target="_blank" size="small">Download</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
} 