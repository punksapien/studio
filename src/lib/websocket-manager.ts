import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface MessageHandlers {
  onMessage: (payload: RealtimePostgresChangesPayload<any>) => void;
  onPresence?: (payload: any) => void;
  onStatusChange: (status: string) => void;
}

interface ChannelConfig {
  conversationId: string;
  handlers: MessageHandlers;
  retryCount: number;
  lastConnected: number;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private channelConfigs: Map<string, ChannelConfig> = new Map();
  private connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private supabase = createClientComponentClient();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  // Singleton pattern
  static getInstance() {
    if (!this.instance) {
      this.instance = new WebSocketManager();
    }
    return this.instance;
  }

  // Subscribe to a conversation with automatic reconnection
  subscribeToConversation(conversationId: string, handlers: MessageHandlers): RealtimeChannel {
    console.log(`[WS-MANAGER] Subscribing to conversation: ${conversationId}`);

    // Clean up existing channel if any
    this.unsubscribe(conversationId);

    // Store configuration for reconnection
    this.channelConfigs.set(conversationId, {
      conversationId,
      handlers,
      retryCount: 0,
      lastConnected: Date.now(),
    });

    return this.createChannel(conversationId, handlers);
  }

  // Create channel with error handling
  private createChannel(conversationId: string, handlers: MessageHandlers): RealtimeChannel {
    const channelName = `conversation_${conversationId}`;

    const channel = this.supabase
      .channel(channelName, {
        config: {
          presence: {
            key: conversationId,
          },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log(`[WS-MANAGER] Message received for ${conversationId}`);
          handlers.onMessage(payload);
        }
      );

    // Add presence support if handler provided
    if (handlers.onPresence) {
      channel.on('presence', { event: 'sync' }, handlers.onPresence);
    }

    // Subscribe with enhanced status handling
    channel.subscribe((status) => {
      console.log(`[WS-MANAGER] Channel ${conversationId} status: ${status}`);
      this.handleStatusChange(conversationId, status, handlers);
    });

    this.channels.set(conversationId, channel);
    return channel;
  }

  // Handle connection status changes
  private handleStatusChange(conversationId: string, status: string, handlers: MessageHandlers) {
    handlers.onStatusChange(status);

    const config = this.channelConfigs.get(conversationId);
    if (!config) return;

    switch (status) {
      case 'SUBSCRIBED':
        console.log(`[WS-MANAGER] Successfully connected to ${conversationId}`);
        config.retryCount = 0;
        config.lastConnected = Date.now();
        this.connectionState = 'connected';
        break;

      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
      case 'CLOSED':
        console.error(`[WS-MANAGER] Connection error for ${conversationId}: ${status}`);
        this.connectionState = 'disconnected';
        this.scheduleReconnect(conversationId);
        break;
    }
  }

  // Reconnection logic with exponential backoff
  private scheduleReconnect(conversationId: string) {
    const config = this.channelConfigs.get(conversationId);
    if (!config) return;

    // Clear any existing reconnect timer
    const existingTimer = this.reconnectTimers.get(conversationId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Calculate backoff delay (max 30 seconds)
    const delay = Math.min(1000 * Math.pow(2, config.retryCount), 30000);
    config.retryCount++;

    console.log(`[WS-MANAGER] Scheduling reconnect for ${conversationId} in ${delay}ms (attempt ${config.retryCount})`);

    const timer = setTimeout(() => {
      console.log(`[WS-MANAGER] Attempting to reconnect ${conversationId}`);
      this.unsubscribe(conversationId, false); // Don't clear config
      this.createChannel(conversationId, config.handlers);
    }, delay);

    this.reconnectTimers.set(conversationId, timer);
  }

  // Unsubscribe from a conversation
  unsubscribe(conversationId: string, clearConfig = true) {
    console.log(`[WS-MANAGER] Unsubscribing from conversation: ${conversationId}`);

    // Clear reconnect timer
    const timer = this.reconnectTimers.get(conversationId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(conversationId);
    }

    // Remove channel
    const channel = this.channels.get(conversationId);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(conversationId);
    }

    // Clear config if requested
    if (clearConfig) {
      this.channelConfigs.delete(conversationId);
    }
  }

  // Disconnect all channels
  disconnectAll() {
    console.log('[WS-MANAGER] Disconnecting all channels');

    // Clear all reconnect timers
    this.reconnectTimers.forEach((timer) => clearTimeout(timer));
    this.reconnectTimers.clear();

    // Remove all channels
    this.channels.forEach((channel, id) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.channelConfigs.clear();
    this.connectionState = 'disconnected';
  }

  // Get connection state
  getConnectionState() {
    return this.connectionState;
  }

  // Get active channel count
  getActiveChannelCount() {
    return this.channels.size;
  }
}

export default WebSocketManager;
