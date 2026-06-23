import { useEffect, useRef, useState, useCallback } from 'react';
import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';

export function useGameSocket(gameCode: string, onMessage: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<{ [peerId: string]: DataConnection }>({});
  const clientConnRef = useRef<DataConnection | null>(null);

  // Keep callback ref updated to prevent re-subscribing on every callback change
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!gameCode) return;

    // Use lowercased room code as a prefix/channel matching token.
    // Storyteller is the host, matching "botc-host-<gamecode>"
    // Since peer IDs must be unique globally, we make the storyteller the "host".
    // If we're the host, we listen for connections.
    // If we're the player, we connect to the host.
    const path = window.location.pathname + window.location.hash;
    const isHost = path.includes('/standard') || path.includes('/whale-bucket');
    const topic = `botc-companion-${gameCode.toLowerCase()}`;
    const hostPeerId = `${topic}-host`;

    let isMounted = true;
    let peer: Peer;

    if (isHost) {
      console.log(`[P2P Host] Initializing peer with ID: ${hostPeerId}`);
      peer = new Peer(hostPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject"
            },
            {
              urls: "turn:openrelay.metered.ca:443",
              username: "openrelayproject",
              credential: "openrelayproject"
            },
            {
              urls: "turn:openrelay.metered.ca:443?transport=tcp",
              username: "openrelayproject",
              credential: "openrelayproject"
            }
          ]
        }
      });
      peerRef.current = peer;

      peer.on('open', () => {
        if (isMounted) {
          console.log(`[P2P Host] Registered signaling ID: ${hostPeerId}`);
          setIsConnected(true);
        }
      });

      peer.on('connection', (conn) => {
        if (!isMounted) return;
        console.log(`[P2P Host] Accepted connection from player peer: ${conn.peer}`);
        connectionsRef.current[conn.peer] = conn;

        conn.on('open', () => {
          console.log(`[P2P Host] Connection handshaked with: ${conn.peer}`);
        });

        conn.on('data', (data: any) => {
          console.log(`[P2P Host] Received data from ${conn.peer}:`, data);
          onMessageRef.current(data);
        });

        conn.on('close', () => {
          console.log(`[P2P Host] Connection closed by: ${conn.peer}`);
          delete connectionsRef.current[conn.peer];
        });

        conn.on('error', (err) => {
          console.error(`[P2P Host] Connection error with ${conn.peer}:`, err);
        });
      });
    } else {
      // Player client connects to host
      // Generate a random client peer ID
      const clientPeerId = `${topic}-client-${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[P2P Client] Initializing peer with ID: ${clientPeerId}`);
      peer = new Peer(clientPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject"
            },
            {
              urls: "turn:openrelay.metered.ca:443",
              username: "openrelayproject",
              credential: "openrelayproject"
            },
            {
              urls: "turn:openrelay.metered.ca:443?transport=tcp",
              username: "openrelayproject",
              credential: "openrelayproject"
            }
          ]
        }
      });
      peerRef.current = peer;

      let reconnectTimeout: any;

      const connectToHost = () => {
        if (!isMounted) return;
        console.log(`[P2P Client] Connecting to host ID: ${hostPeerId}`);
        const conn = peer.connect(hostPeerId, {
          reliable: true,
        });
        clientConnRef.current = conn;

        conn.on('open', () => {
          if (isMounted) {
            console.log(`[P2P Client] Connected to host successfully.`);
            setIsConnected(true);
          }
        });

        conn.on('data', (data: any) => {
          console.log(`[P2P Client] Received data from host:`, data);
          onMessageRef.current(data);
        });

        conn.on('close', () => {
          if (isMounted) {
            console.log(`[P2P Client] Host disconnected. Reconnecting in 3s...`);
            setIsConnected(false);
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connectToHost, 3000);
          }
        });

        conn.on('error', (err) => {
          console.error(`[P2P Client] Host connection error:`, err);
          conn.close();
        });
      };

      peer.on('open', () => {
        connectToHost();
      });

      peer.on('error', (err: any) => {
        console.error(`[P2P Client] Peer error:`, err);
        if (err.type === 'peer-unavailable') {
          console.log(`[P2P Client] Host peer is currently unavailable. Retrying in 3s...`);
          setIsConnected(false);
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connectToHost, 3000);
        }
      });

      return () => {
        clearTimeout(reconnectTimeout);
      };
    }

    return () => {
      isMounted = false;
      if (peerRef.current) {
        console.log(`[P2P] Cleaning up PeerJS instance`);
        peerRef.current.destroy();
      }
    };
  }, [gameCode]);

  const sendMessage = useCallback(async (payload: any) => {
    const path = window.location.pathname + window.location.hash;
    const isHost = path.includes('/standard') || path.includes('/whale-bucket');
    if (isHost) {
      console.log(`[P2P Host] Broadcasting message to all connected clients:`, payload);
      Object.values(connectionsRef.current).forEach((conn) => {
        if (conn.open) {
          conn.send(payload);
        }
      });
    } else {
      if (clientConnRef.current && clientConnRef.current.open) {
        console.log(`[P2P Client] Sending message to host:`, payload);
        clientConnRef.current.send(payload);
      } else {
        console.warn(`[P2P Client] Cannot send message: Connection to host is not open.`);
      }
    }
  }, []);

  return { isConnected, sendMessage };
}
