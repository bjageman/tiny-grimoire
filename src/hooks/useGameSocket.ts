import { useEffect, useRef, useState, useCallback } from 'react';

// Read endpoints and credentials from environment variables.
// Leave USERNAME/PASSWORD blank when using the public ntfy.sh broker.
const NTFY_SERVER_URL = import.meta.env.VITE_NTFY_SERVER_URL || 'ntfy.sh';
const NTFY_USERNAME = import.meta.env.VITE_NTFY_ADMIN_USERNAME || '';
const NTFY_PASSWORD = import.meta.env.VITE_NTFY_ADMIN_PASSWORD || '';

// Retry a rejected publish (rate-limited / transient) rather than dropping it.
const PUBLISH_MAX_ATTEMPTS = 4;
const PUBLISH_BASE_DELAY_MS = 300;

/**
 * Build the ?auth= query parameter string for ntfy.
 *
 * ntfy expects the ?auth= value to be the *base64url-encoded* form of the
 * entire Authorization header value (e.g. base64url("Basic <base64(u:p)>")).
 * Standard URL-encoding ("Basic%20...") is NOT accepted and returns a 500.
 * Using ?auth= for both the WebSocket URL and the POST URL avoids sending an
 * Authorization header, which would otherwise trigger a CORS preflight that
 * ntfy cannot satisfy when Access-Control-Allow-Origin is set to '*'.
 */
function buildAuthParam(): string {
  if (!NTFY_USERNAME || !NTFY_PASSWORD) return '';
  const headerValue = `Basic ${btoa(`${NTFY_USERNAME}:${NTFY_PASSWORD}`)}`;
  // base64url-encode the full header value (no padding, url-safe chars)
  const encoded = btoa(headerValue)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `?auth=${encoded}`;
}

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
      
      const wsUrl = `${protocol}://${domain}/${topic}/ws${buildAuthParam()}`;
      console.log(`[ntfy] Connecting to: ${protocol}://${domain}/${topic}/ws`);
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

  const sendMessage = useCallback(async (payload: unknown): Promise<boolean> => {
    if (!gameCode) return false;
    const topic = `botc-companion-${gameCode.toLowerCase()}`;
    const cleanDomain = NTFY_SERVER_URL.replace(/^(https?:\/\/|wss?:\/\/)/, '');
    const protocol = cleanDomain.startsWith('localhost') || cleanDomain.startsWith('127.0.0.1') ? 'http' : 'https';
    // Use ?auth= query param instead of Authorization header to avoid CORS preflight.
    const publishUrl = `${protocol}://${cleanDomain}/${topic}${buildAuthParam()}`;

    console.log(`[ntfy] Publishing message to: ${protocol}://${cleanDomain}/${topic}`, payload);

    // Publishing is a plain HTTP POST to the ntfy broker. Under a burst of
    // near-simultaneous messages (e.g. many players joining at once) the public
    // broker rate-limits and rejects some POSTs — a silently dropped publish
    // means the storyteller never sees that join, or a player never gets their
    // ack. Retry with exponential backoff + jitter (honoring Retry-After on a
    // 429) so a transient rejection recovers instead of vanishing. Returns
    // whether the publish ultimately succeeded; callers must NOT treat a false
    // result as "delivered".
    for (let attempt = 1; attempt <= PUBLISH_MAX_ATTEMPTS; attempt++) {
      let retryAfterMs: number | null = null;
      try {
        const response = await fetch(publishUrl, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (response.ok) return true;
        const retryAfter = Number(response.headers.get('Retry-After'));
        if (Number.isFinite(retryAfter) && retryAfter > 0) retryAfterMs = retryAfter * 1000;
        console.warn(`[ntfy] publish attempt ${attempt}/${PUBLISH_MAX_ATTEMPTS} failed: ${response.status} ${response.statusText}`);
      } catch (e) {
        console.warn(`[ntfy] publish attempt ${attempt}/${PUBLISH_MAX_ATTEMPTS} errored:`, e);
      }
      if (attempt < PUBLISH_MAX_ATTEMPTS) {
        const backoff = retryAfterMs ?? PUBLISH_BASE_DELAY_MS * 2 ** (attempt - 1);
        const jitter = Math.random() * PUBLISH_BASE_DELAY_MS;
        await new Promise(resolve => setTimeout(resolve, backoff + jitter));
      }
    }
    console.error(`[ntfy] HTTP POST publish permanently failed after ${PUBLISH_MAX_ATTEMPTS} attempts.`);
    return false;
  }, [gameCode]);

  return { isConnected, sendMessage };
}
