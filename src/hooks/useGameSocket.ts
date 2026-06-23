import { useEffect, useRef, useState, useCallback } from 'react';

// Use a free public PieSocket demo cluster API key for development and testing.
// PieSocket provides a generous free tier of 500k messages/day and 100 concurrent connections.
const PIESOCKET_API_KEY = import.meta.env.VITE_PIESOCKET_API_KEY || '';
const PIESOCKET_CLUSTER_ID = import.meta.env.VITE_PIESOCKET_CLUSTER_ID || 'demo';

export function useGameSocket(gameCode: string, onMessage: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref updated to prevent re-subscribing on every callback change
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!gameCode) return;
    const channelId = `botc-companion-${gameCode.toLowerCase()}`;
    let isMounted = true;
    let reconnectTimeout: any;

    function connect() {
      // Connect to PieSocket public demo cluster WebSocket
      const wsUrl = `wss://${PIESOCKET_CLUSTER_ID}.piesocket.com/v3/${channelId}?api_key=${PIESOCKET_API_KEY}`;
      console.log(`[PieSocket] Connecting to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) {
          console.log(`[PieSocket] Connection opened successfully for channel: ${channelId}`);
          setIsConnected(true);
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log(`[PieSocket] Message received on channel ${channelId}:`, payload);
          onMessageRef.current(payload);
        } catch (e) {
          console.warn(`[PieSocket] Non-JSON or unparseable event on channel ${channelId}:`, event.data, e);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          console.warn(`[PieSocket] Connection closed for channel ${channelId}. Attempting reconnection in 3s...`);
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error(`[PieSocket] Error on channel ${channelId}:`, error);
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        console.log(`[PieSocket] Cleaning up connection for channel: ${channelId}`);
        wsRef.current.close();
      }
    };
  }, [gameCode]);

  const sendMessage = useCallback(async (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`[PieSocket] Publishing message to channel:`, payload);
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.warn(`[PieSocket] WebSocket is not open. Cannot send message:`, payload);
    }
  }, []);

  return { isConnected, sendMessage };
}
