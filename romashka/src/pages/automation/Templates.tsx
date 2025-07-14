import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, CardActions, Button, Typography, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';

const templates = [
  { id: 'lead-capture', name: 'Lead Capture', description: 'Capture visitor info and qualify leads.' },
  { id: 'support-faq', name: 'Support FAQ', description: 'Answer common support questions automatically.' },
  { id: 'booking', name: 'Booking Flow', description: 'Guide users through a booking process.' },
];

export default function Templates() {
  const navigate = useNavigate();

  const handleGoToAdvancedTemplates = () => {
    navigate('/templates');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          This is the basic template library. For advanced response templates with AI training, variables, and analytics, 
          <Button 
            size="small" 
            onClick={handleGoToAdvancedTemplates}
            sx={{ ml: 1 }}
          >
            go to the new Templates system
          </Button>
        </Typography>
      </Alert>
      
      <Typography variant="h6" mb={2}>Template Library</Typography>
      <Grid container spacing={2}>
        {templates.map(t => (
          <Grid item xs={12} md={4} key={t.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary">{t.description}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" variant="outlined">Preview</Button>
                <Button size="small" variant="contained">Import</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 