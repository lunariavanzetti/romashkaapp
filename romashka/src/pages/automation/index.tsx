import React from 'react';
import { Box, Drawer, List, ListItemText, Typography, useMediaQuery, ListItemButton } from '@mui/material';
import FlowBuilder from './FlowBuilder';

export default function AutomationPage() {
  const isMobile = useMediaQuery('(max-width:768px)');
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Automation</Typography>
            <List>
              <ListItemButton selected sx={{ minHeight: 44 }}>
                <ListItemText primary="Flow Builder" />
              </ListItemButton>
              <ListItemButton sx={{ minHeight: 44 }}>
                <ListItemText primary="Templates" />
              </ListItemButton>
              <ListItemButton sx={{ minHeight: 44 }}>
                <ListItemText primary="Smart Responses" />
              </ListItemButton>
              <ListItemButton sx={{ minHeight: 44 }}>
                <ListItemText primary="Analytics" />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
      )}
      <Box sx={{ flex: 1, overflow: 'auto', width: '100vw' }}>
        <FlowBuilder />
      </Box>
    </Box>
  );
} 