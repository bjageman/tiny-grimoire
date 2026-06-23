import { useEffect, useRef, useState, useCallback } from 'react';

// Read endpoints from environment variables so the user can easily swap
// between public ntfy.sh or a self-hosted ntfy server instance.
const NTFY_SERVER_URL = import.meta.env.VITE_NTFY_SERVER_URL || 'ntfy.sh';

export function useGameSocket(gameCode: string, onMessage: (data: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref updated to prevent re-subscribing on every callback change
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!gameCode) return;
    const topic = `botc-companion-${gameCode.toLowerCase()}`;
    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      // Determine WebSocket protocol (ws: or wss:) based on secure/unsecure context
      const protocol = NTFY_SERVER_URL.startsWith('localhost') || NTFY_SERVER_URL.startsWith('127.0.0.1') ? 'ws' : 'wss';
      // Clean domain name string (strip protocol prefix if provided in env)
      const domain = NTFY_SERVER_URL.replace(/^(https?:\/\/|wss?:\/\/)/, '');
      
      const wsUrl = `${protocol}://${domain}/${topic}/ws`;
      console.log(`[ntfy] Connecting to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) {
          console.log(`[ntfy] Connection opened successfully for topic: ${topic}`);
          setIsConnected(true);
        }
      };

      ws.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data);
          if (eventData.message) {
            const payload = JSON.parse(eventData.message) as unknown;
            console.log(`[ntfy] Message received on topic ${topic}:`, payload);
            onMessageRef.current(payload);
          }
        } catch (e) {
          console.warn(`[ntfy] Non-JSON or unparseable event on topic ${topic}:`, event.data, e);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          console.warn(`[ntfy] Connection closed for topic ${topic}. Attempting reconnection in 3s...`);
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error(`[ntfy] Error on topic ${topic}:`, error);
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        console.log(`[ntfy] Cleaning up connection for topic: ${topic}`);
        wsRef.current.close();
      }
    };
  }, [gameCode]);

  const sendMessage = useCallback(async (payload: unknown) => {
    if (!gameCode) return;
    const topic = `botc-companion-${gameCode.toLowerCase()}`;
    const cleanDomain = NTFY_SERVER_URL.replace(/^(https?:\/\/|wss?:\/\/)/, '');
    const protocol = cleanDomain.startsWith('localhost') || cleanDomain.startsWith('127.0.0.1') ? 'http' : 'https';
    const publishUrl = `${protocol}://${cleanDomain}/${topic}`;

    console.log(`[ntfy] Publishing message to: ${publishUrl}`, payload);
    try {
      const response = await fetch(publishUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error(`[ntfy] HTTP POST publish failed with status: ${response.status} ${response.statusText}`);
      }
    } catch (e) {
      console.error(`[ntfy] Exception during HTTP POST publish:`, e);
    }
  }, [gameCode]);

  return { isConnected, sendMessage };
}
