import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
// @ts-ignore
import SockJS from 'sockjs-client/dist/sockjs.min.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useAdminChatNotifications(onNewConversation?: () => void) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wsUrl = API_BASE_URL.endsWith('/') ? `${API_BASE_URL}ws` : `${API_BASE_URL}/ws`;
    
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/admin/conversations`, (msg: IMessage) => {
          if (msg.body === 'NEW_CONVERSATION' && onNewConversation) {
            onNewConversation();
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [onNewConversation]);

  return { isConnected };
}
