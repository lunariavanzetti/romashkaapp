/**
 * WebSocket Manager for Real-time Updates
 * Handles WebSocket connections and broadcasts webhook events to clients
 */

import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from 'http';
import { supabase } from '../supabaseClient';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface ConnectedClient {
  id: string;
  userId?: string;
  subscriptions: string[];
  lastSeen: Date;
  socket: WebSocket;
}

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private server: any = null;
  private readonly PORT = parseInt(process.env.WS_PORT || '8080');

  constructor() {
    this.initialize();
  }

  /**
   * Initialize WebSocket server
   */
  private initialize(): void {
    try {
      // Create HTTP server for WebSocket
      this.server = createServer();
      
      // Create WebSocket server
      this.wss = new WebSocketServer({ 
        server: this.server,
        path: '/ws'
      });

      this.wss.on('connection', (ws, request) => {
        this.handleConnection(ws, request);
      });

      // Start server
      this.server.listen(this.PORT, () => {
        console.log(`WebSocket server listening on port ${this.PORT}`);
      });

      // Start cleanup job
      this.startCleanupJob();

    } catch (error) {
      console.error('Error initializing WebSocket server:', error);
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = this.generateClientId();
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    const client: ConnectedClient = {
      id: clientId,
      userId: userId || undefined,
      subscriptions: [],
      lastSeen: new Date(),
      socket: ws
    };

    this.clients.set(clientId, client);
    
    console.log(`WebSocket client connected: ${clientId} (User: ${userId || 'anonymous'})`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection',
      data: { 
        clientId,
        message: 'Connected to ROMASHKA webhook system',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    // Handle messages from client
    ws.on('message', (message) => {
      this.handleClientMessage(clientId, message);
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    });

    // Update last seen
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastSeen = new Date();
      }
    });
  }

  /**
   * Handle messages from client
   */
  private handleClientMessage(clientId: string, message: any): void {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      const parsedMessage = JSON.parse(message.toString());
      client.lastSeen = new Date();

      switch (parsedMessage.type) {
        case 'subscribe':
          this.handleSubscription(clientId, parsedMessage.data);
          break;

        case 'unsubscribe':
          this.handleUnsubscription(clientId, parsedMessage.data);
          break;

        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString()
          });
          break;

        case 'get_stats':
          this.sendWebhookStats(clientId);
          break;

        default:
          console.log(`Unknown message type from client ${clientId}:`, parsedMessage.type);
      }

    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
    }
  }

  /**
   * Handle client subscription to events
   */
  private handleSubscription(clientId: string, subscriptionData: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { events } = subscriptionData;
    
    if (Array.isArray(events)) {
      events.forEach(event => {
        if (!client.subscriptions.includes(event)) {
          client.subscriptions.push(event);
        }
      });
    }

    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      data: { 
        subscriptions: client.subscriptions,
        message: `Subscribed to ${events?.length || 0} event types`
      },
      timestamp: new Date().toISOString()
    });

    console.log(`Client ${clientId} subscribed to:`, client.subscriptions);
  }

  /**
   * Handle client unsubscription from events
   */
  private handleUnsubscription(clientId: string, unsubscriptionData: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { events } = unsubscriptionData;
    
    if (Array.isArray(events)) {
      events.forEach(event => {
        const index = client.subscriptions.indexOf(event);
        if (index > -1) {
          client.subscriptions.splice(index, 1);
        }
      });
    }

    this.sendToClient(clientId, {
      type: 'unsubscription_confirmed',
      data: { 
        subscriptions: client.subscriptions,
        message: `Unsubscribed from ${events?.length || 0} event types`
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`WebSocket client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    }
  }

  /**
   * Broadcast message to all subscribed clients
   */
  async broadcast(eventType: string, data: any): Promise<void> {
    const message: WebSocketMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    const subscribedClients = Array.from(this.clients.values()).filter(client => 
      client.subscriptions.includes(eventType) || 
      client.subscriptions.includes('*') // Wildcard subscription
    );

    for (const client of subscribedClients) {
      this.sendToClient(client.id, message);
    }

    // Log broadcast
    if (subscribedClients.length > 0) {
      console.log(`Broadcasted ${eventType} to ${subscribedClients.length} clients`);
      
      // Also log to database for analytics
      await this.logBroadcast(eventType, data, subscribedClients.length);
    }
  }

  /**
   * Send webhook statistics to client
   */
  private async sendWebhookStats(clientId: string): Promise<void> {
    try {
      // Import WebhookEventQueue to get stats
      const { WebhookEventQueue } = await import('./eventQueue');
      const queue = new WebhookEventQueue();
      const stats = await queue.getStats();

      // Get additional stats from database
      const recentEvents = await this.getRecentWebhookEvents();
      const providerStats = await this.getProviderStats();

      this.sendToClient(clientId, {
        type: 'webhook_stats',
        data: {
          queue: stats,
          recent_events: recentEvents,
          provider_stats: providerStats,
          connected_clients: this.clients.size
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending webhook stats:', error);
    }
  }

  /**
   * Get recent webhook events from database
   */
  private async getRecentWebhookEvents(): Promise<any[]> {
    try {
      const { data, error } = await supabase!
        .from('webhook_events')
        .select('provider, event_type, processed, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent webhook events:', error);
      return [];
    }
  }

  /**
   * Get provider statistics
   */
  private async getProviderStats(): Promise<any[]> {
    try {
      const { data, error } = await supabase!
        .from('webhook_events')
        .select('provider, processed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) throw error;

      // Group by provider and calculate stats
      const stats: Record<string, { total: number; processed: number; failed: number }> = {};
      
      data?.forEach(event => {
        if (!stats[event.provider]) {
          stats[event.provider] = { total: 0, processed: 0, failed: 0 };
        }
        stats[event.provider].total++;
        if (event.processed) {
          stats[event.provider].processed++;
        } else {
          stats[event.provider].failed++;
        }
      });

      return Object.entries(stats).map(([provider, stat]) => ({
        provider,
        ...stat,
        success_rate: stat.total > 0 ? (stat.processed / stat.total) * 100 : 0
      }));

    } catch (error) {
      console.error('Error fetching provider stats:', error);
      return [];
    }
  }

  /**
   * Start cleanup job for stale connections
   */
  private startCleanupJob(): void {
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000); // Run every 30 seconds

    // Send ping to all clients every 30 seconds
    setInterval(() => {
      this.pingAllClients();
    }, 30000);
  }

  /**
   * Clean up stale connections
   */
  private cleanupStaleConnections(): void {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = new Date();

    for (const [clientId, client] of this.clients.entries()) {
      const timeSinceLastSeen = now.getTime() - client.lastSeen.getTime();
      
      if (timeSinceLastSeen > staleThreshold || client.socket.readyState !== WebSocket.OPEN) {
        console.log(`Cleaning up stale connection: ${clientId}`);
        this.handleDisconnection(clientId);
      }
    }
  }

  /**
   * Send ping to all connected clients
   */
  private pingAllClients(): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.ping();
        } catch (error) {
          console.error(`Error pinging client ${clientId}:`, error);
          this.handleDisconnection(clientId);
        }
      }
    }
  }

  /**
   * Log broadcast for analytics
   */
  private async logBroadcast(eventType: string, data: any, clientCount: number): Promise<void> {
    try {
      await supabase!
        .from('websocket_broadcasts')
        .insert({
          event_type: eventType,
          data,
          client_count: clientCount,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging broadcast:', error);
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get client subscriptions
   */
  getClientSubscriptions(): Record<string, string[]> {
    const subscriptions: Record<string, string[]> = {};
    
    for (const [clientId, client] of this.clients.entries()) {
      subscriptions[clientId] = client.subscriptions;
    }
    
    return subscriptions;
  }

  /**
   * Broadcast to specific user
   */
  async broadcastToUser(userId: string, eventType: string, data: any): Promise<void> {
    const userClients = Array.from(this.clients.values()).filter(client => 
      client.userId === userId
    );

    const message: WebSocketMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    for (const client of userClients) {
      this.sendToClient(client.id, message);
    }

    if (userClients.length > 0) {
      console.log(`Broadcasted ${eventType} to user ${userId} (${userClients.length} connections)`);
    }
  }

  /**
   * Close all connections and shutdown server
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down WebSocket server...');
    
    // Close all client connections
    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.socket.close();
      } catch (error) {
        console.error(`Error closing client ${clientId}:`, error);
      }
    }
    
    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Close HTTP server
    if (this.server) {
      this.server.close();
    }

    console.log('WebSocket server shutdown complete');
  }
}