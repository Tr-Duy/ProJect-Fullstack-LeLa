import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
// @ts-ignore
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import type { ChatMessage, SendMessageRequest } from '../types/chat.types';
import { chatApi } from '../api/chat.api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export function useWebSocketChat(conversationId: number | null, guestToken?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!conversationId) return;
    try {
      let res;
      if (guestToken) {
        res = await chatApi.getGuestMessages(guestToken);
      } else {
        res = await chatApi.getMessages(conversationId);
      }
      setMessages(res.data || []);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử chat:', err);
    }
  }, [conversationId, guestToken]);

  useEffect(() => {
    if (!conversationId) return;
    
    fetchHistory();

    const token = localStorage.getItem('accessToken');
    const wsUrl = API_BASE_URL.endsWith('/') ? `${API_BASE_URL}ws` : `${API_BASE_URL}/ws`;
    
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/conversation/${conversationId}`, (msg: IMessage) => {
          if (msg.body) {
            const newMsg = JSON.parse(msg.body) as ChatMessage;
            setMessages(prev => [...prev, newMsg]);
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [conversationId, fetchHistory]);

  const sendMessage = useCallback((content: string) => {
    if (!clientRef.current || !clientRef.current.connected || !conversationId) return;
    
    const request: SendMessageRequest = {
      conversationId,
      content,
      guestToken
    };

    const dest = guestToken ? '/app/chat.guest.send' : '/app/chat.send';
    clientRef.current.publish({
      destination: dest,
      body: JSON.stringify(request)
    });
  }, [conversationId, guestToken]);

  return { messages, isConnected, sendMessage };
}
