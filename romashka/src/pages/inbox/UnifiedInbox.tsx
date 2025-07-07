import React, { useState } from 'react';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemIcon, ListItemText, Badge, Avatar, Divider, TextField, Button } from '@mui/material';
import { WhatsApp, Facebook, Instagram, Twitter, Language } from '@mui/icons-material';
import type { Channel, ConversationThread, Message, CustomerInfo } from '../../types/channels';

const mockChannels: Channel[] = [
  { id: 'website', type: 'website', name: 'Website', unread: 2, connected: true },
  { id: 'whatsapp', type: 'whatsapp', name: 'WhatsApp', unread: 1, connected: true },
  { id: 'instagram', type: 'instagram', name: 'Instagram', unread: 0, connected: false },
  { id: 'facebook', type: 'facebook', name: 'Facebook', unread: 0, connected: true },
  { id: 'twitter', type: 'twitter', name: 'Twitter', unread: 0, connected: false },
];

const mockThreads: ConversationThread[] = [
  { id: 't1', channelId: 'website', customerId: 'c1', preview: 'Hi, I need help!', unread: true, lastMessageAt: '2024-07-01T12:00:00Z' },
  { id: 't2', channelId: 'whatsapp', customerId: 'c2', preview: 'Order status?', unread: false, lastMessageAt: '2024-07-01T11:00:00Z' },
];

const mockMessages: Message[] = [
  { id: 'm1', threadId: 't1', sender: 'customer', content: 'Hi, I need help!', timestamp: '2024-07-01T12:00:00Z', channel: 'website' },
  { id: 'm2', threadId: 't1', sender: 'agent', content: 'How can I assist you?', timestamp: '2024-07-01T12:01:00Z', channel: 'website' },
];

const mockCustomer: CustomerInfo = {
  id: 'c1',
  name: 'Alice Smith',
  avatarUrl: '',
  email: 'alice@email.com',
  phone: '+1234567890',
  socialHandles: { instagram: '@alice', facebook: 'alice.fb' },
  history: mockThreads,
};

function getChannelIcon(type: string) {
  switch (type) {
    case 'website': return <Language />;
    case 'whatsapp': return <WhatsApp />;
    case 'instagram': return <Instagram />;
    case 'facebook': return <Facebook />;
    case 'twitter': return <Twitter />;
    default: return <Language />;
  }
}

export default function UnifiedInbox() {
  const [selectedChannel, setSelectedChannel] = useState('website');
  const [selectedThread, setSelectedThread] = useState('t1');
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* Channel Sidebar */}
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 1, height: '80vh', overflow: 'auto' }}>
            <Typography variant="h6" mb={2}>Channels</Typography>
            <List>
              {mockChannels.map(ch => (
                <ListItem button selected={selectedChannel === ch.id} onClick={() => setSelectedChannel(ch.id)} key={ch.id}>
                  <ListItemIcon>
                    <Badge color="error" badgeContent={ch.unread} invisible={ch.unread === 0}>{getChannelIcon(ch.type)}</Badge>
                  </ListItemIcon>
                  <ListItemText primary={ch.name} secondary={ch.connected ? '' : 'Not connected'} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        {/* Conversation List */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 1, height: '80vh', overflow: 'auto' }}>
            <Typography variant="h6" mb={2}>Conversations</Typography>
            <List>
              {mockThreads.filter(t => t.channelId === selectedChannel).map(t => (
                <ListItem button selected={selectedThread === t.id} onClick={() => setSelectedThread(t.id)} key={t.id}>
                  <ListItemText primary={t.preview} secondary={new Date(t.lastMessageAt).toLocaleString()} />
                  {t.unread && <Badge color="error" variant="dot" />}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        {/* Chat Interface */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 1, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" mb={2}>Chat</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 1 }}>
              {mockMessages.filter(m => m.threadId === selectedThread).map(m => (
                <Box key={m.id} sx={{ mb: 1, textAlign: m.sender === 'agent' ? 'right' : 'left' }}>
                  <Paper sx={{ display: 'inline-block', p: 1, bgcolor: m.sender === 'agent' ? 'primary.light' : 'grey.100', color: m.sender === 'agent' ? 'primary.contrastText' : 'text.primary' }}>{m.content}</Paper>
                  <Typography variant="caption" color="text.secondary">{new Date(m.timestamp).toLocaleTimeString()}</Typography>
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth placeholder="Type a message..." />
              <Button variant="contained">Send</Button>
            </Box>
          </Paper>
        </Grid>
        {/* Customer Info */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '80vh', overflow: 'auto' }}>
            <Typography variant="h6" mb={2}>Customer Info</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={mockCustomer.avatarUrl} sx={{ width: 48, height: 48, mr: 2 }} />
              <Box>
                <Typography fontWeight={600}>{mockCustomer.name}</Typography>
                <Typography variant="body2" color="text.secondary">{mockCustomer.email}</Typography>
                <Typography variant="body2" color="text.secondary">{mockCustomer.phone}</Typography>
              </Box>
            </Box>
            <Typography variant="subtitle2" mb={1}>Social</Typography>
            <Box sx={{ mb: 2 }}>
              {mockCustomer.socialHandles && Object.entries(mockCustomer.socialHandles).map(([k, v]) => (
                <Chip key={k} label={`${k}: ${v}`} size="small" sx={{ mr: 0.5 }} />
              ))}
            </Box>
            <Typography variant="subtitle2" mb={1}>History</Typography>
            <List>
              {mockCustomer.history.map(h => (
                <ListItem key={h.id}><ListItemText primary={h.preview} secondary={new Date(h.lastMessageAt).toLocaleString()} /></ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 