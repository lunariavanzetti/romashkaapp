import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';

export default function Privacy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Privacy Policy
      </Typography>
      
      <Paper sx={{ p: 4, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          ROMASHKA Privacy Policy
        </Typography>
        
        <Typography variant="body1" paragraph>
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          1. Information We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          We collect information you provide directly to us, such as when you create an account, 
          use our services, or contact us for support. This may include your name, email address, 
          and any other information you choose to provide.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          2. How We Use Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We use the information we collect to provide, maintain, and improve our services, 
          to communicate with you, and to develop new features and services.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          3. Information Sharing
        </Typography>
        <Typography variant="body1" paragraph>
          We do not sell, trade, or otherwise transfer your personal information to third parties 
          without your consent, except as described in this policy or as required by law.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          4. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We implement appropriate security measures to protect your personal information 
          against unauthorized access, alteration, disclosure, or destruction.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          5. Third-Party Services
        </Typography>
        <Typography variant="body1" paragraph>
          Our service may integrate with third-party platforms (such as Instagram, WhatsApp, 
          etc.) to provide enhanced functionality. These integrations are subject to the 
          respective platform's privacy policies.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          6. Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about this Privacy Policy, please contact us at: 
          <br />
          Email: privacy@romashka.com
          <br />
          Website: https://romashkaai.vercel.app
        </Typography>
      </Paper>
    </Container>
  );
} 