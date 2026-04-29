import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080');

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL);

    s.on('connect', () => {
      console.log('[socket]: Connected to server');
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[socket]: Disconnected from server');
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return { socket, isConnected };
};
