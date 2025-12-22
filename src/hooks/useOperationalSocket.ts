'use client';

/**
 * Page-Scoped Socket.IO Hook for Club Operations
 * 
 * Provides a socket connection scoped to the club operations page only.
 * Ensures socket connects only when:
 * - clubId is defined
 * - accessToken is available
 * - user is on the club operational page
 * 
 * Features:
 * - One connection per page lifecycle
 * - Stable socket reference using useRef
 * - Strict connect/disconnect lifecycle
 * - No connection with invalid state
 * - Single-club scope
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/useAuthStore';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/types/socket';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseOperationalSocketOptions {
  /**
   * The club ID for which to establish the socket connection.
   * Socket will NOT connect if this is null or undefined.
   */
  clubId: string | null | undefined;
  
  /**
   * Whether the socket should be enabled.
   * Set to false to prevent connection even if clubId is available.
   */
  enabled?: boolean;
}

interface UseOperationalSocketResult {
  /**
   * The socket instance (null if not connected)
   */
  socket: TypedSocket | null;
  
  /**
   * Whether the socket is connected
   */
  isConnected: boolean;
}

/**
 * Hook to manage page-scoped Socket.IO connection for club operations.
 * 
 * @param options - Configuration for the socket connection
 * @returns Socket instance and connection state
 * 
 * @example
 * ```tsx
 * function ClubOperationsPage() {
 *   const clubId = params.clubId as string;
 *   const { socket, isConnected } = useOperationalSocket({ clubId });
 *   
 *   useEffect(() => {
 *     if (!socket) return;
 *     
 *     socket.on('booking_created', handleBookingCreated);
 *     return () => socket.off('booking_created', handleBookingCreated);
 *   }, [socket]);
 * }
 * ```
 */
export function useOperationalSocket({
  clubId,
  enabled = true,
}: UseOperationalSocketOptions): UseOperationalSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<TypedSocket | null>(null);
  const getSocketToken = useAuthStore(state => state.getSocketToken);

  useEffect(() => {
    // Guard: Do not connect if disabled
    if (!enabled) {
      console.log('[useOperationalSocket] Socket disabled by config');
      return;
    }

    // Guard: Do not connect if clubId is invalid
    if (!clubId) {
      console.log('[useOperationalSocket] Socket NOT connecting: clubId is invalid');
      
      // If socket exists, disconnect it
      if (socketRef.current) {
        console.log('[useOperationalSocket] Disconnecting socket due to invalid clubId');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      
      return;
    }

    // Prevent multiple socket instances
    if (socketRef.current) {
      console.warn('[useOperationalSocket] Socket already initialized for clubId:', clubId);
      return;
    }

    console.log('[useOperationalSocket] Initializing socket connection for clubId:', clubId);

    // Initialize socket connection with authentication
    const initializeSocket = async () => {
      // Get token from auth store (cached and deduplicated)
      const token = await getSocketToken();

      if (!token) {
        console.error('[useOperationalSocket] Cannot initialize socket: no token available');
        return;
      }

      // Initialize Socket.IO client with authentication and clubId
      const socket: TypedSocket = io({
        path: '/socket.io',
        auth: {
          token,
          clubId, // Pass clubId for room targeting
        },
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('[useOperationalSocket] Socket connected:', socket.id, 'clubId:', clubId);
        setIsConnected(true);
      });

      socket.on('disconnect', (reason) => {
        console.log('[useOperationalSocket] Socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('[useOperationalSocket] Connection error:', error.message);
        // If authentication fails, don't retry
        if (error.message.includes('Authentication')) {
          console.error('[useOperationalSocket] Authentication failed, disconnecting');
          socket.disconnect();
        }
      });

      // Reconnection handler
      socket.io.on('reconnect', (attemptNumber) => {
        console.log('[useOperationalSocket] Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });
    };

    initializeSocket();

    // Cleanup on unmount or when clubId changes
    return () => {
      if (!socketRef.current) return;
      
      console.log('[useOperationalSocket] Cleaning up socket connection for clubId:', clubId);
      
      const socket = socketRef.current;
      
      // Remove all listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.io.off('reconnect');
      
      // Disconnect socket
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [clubId, enabled, getSocketToken]); // Removed clearSocketToken as it's not used

  return {
    socket: socketRef.current,
    isConnected,
  };
}
