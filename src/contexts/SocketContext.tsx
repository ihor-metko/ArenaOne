'use client';

/**
 * Centralized Socket.IO Context
 * 
 * Provides a single global socket connection to the entire application.
 * Ensures only one socket instance exists and is shared across all components.
 * 
 * Features:
 * - Singleton socket connection (initializes ONCE per app lifecycle)
 * - Authentication via JWT token
 * - Automatic reconnection handling
 * - Connection state tracking
 * - Safe cleanup on unmount
 * 
 * Bootstrap Behavior:
 * - Initializes only when user is authenticated (status === 'authenticated')
 * - Uses hasInitializedRef to prevent re-initialization on re-renders
 * - Dependencies limited to stable values (status, userId) to avoid unnecessary re-runs
 * - Does NOT re-initialize on tab focus, navigation, or session object changes
 * - Only disconnects and re-initializes if user logs out then logs back in
 */

import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/types/socket';

/**
 * Typed Socket.IO client
 */
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Socket Context interface
 */
interface SocketContextValue {
  /**
   * The global socket instance (null if not connected)
   */
  socket: TypedSocket | null;

  /**
   * Whether the socket is connected
   */
  isConnected: boolean;
}

/**
 * Socket Context
 */
const SocketContext = createContext<SocketContextValue | undefined>(undefined);

/**
 * Socket Provider Props
 */
interface SocketProviderProps {
  children: React.ReactNode;
}

/**
 * Global Socket Provider
 * 
 * Wraps the application and provides a single socket connection.
 * Should be placed high in the component tree (e.g., root layout).
 * Requires authentication - will only connect when user is authenticated.
 * 
 * @example
 * ```tsx
 * <SocketProvider>
 *   <App />
 * </SocketProvider>
 * ```
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<TypedSocket | null>(null);
  const { data: session, status } = useSession();
  const hasInitializedRef = useRef(false);
  
  // Extract stable user ID to avoid re-initialization on session object changes
  const userId = session?.user?.id;

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (status !== 'authenticated' || !userId) {
      // If socket exists and user is no longer authenticated, disconnect
      if (socketRef.current) {
        console.log('[SocketProvider] User logged out, disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        hasInitializedRef.current = false;
      }
      return;
    }

    // Prevent multiple socket instances (app-level guard)
    // This ensures socket initializes only ONCE per app lifecycle
    if (hasInitializedRef.current || socketRef.current) {
      console.warn('[SocketProvider] Socket already initialized, skipping');
      return;
    }

    console.log('[SocketProvider] Initializing socket connection with authentication');
    hasInitializedRef.current = true;

    // Get the JWT token via API endpoint
    const getSessionToken = async () => {
      try {
        const response = await fetch('/api/socket/token');
        
        if (!response.ok) {
          console.error('[SocketProvider] Failed to get session token:', response.status);
          return null;
        }

        const data = await response.json();
        return data.token;
      } catch (error) {
        console.error('[SocketProvider] Error getting session token:', error);
        return null;
      }
    };

    // Initialize socket connection with authentication
    const initializeSocket = async () => {
      const token = await getSessionToken();

      if (!token) {
        console.error('[SocketProvider] Cannot initialize socket: no token available');
        hasInitializedRef.current = false; // Allow retry on next render
        return;
      }

      // Initialize Socket.IO client with authentication
      const socket: TypedSocket = io({
        path: '/socket.io',
        auth: {
          token,
        },
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('[SocketProvider] Socket connected:', socket.id);
        setIsConnected(true);
      });

      socket.on('disconnect', (reason) => {
        console.log('[SocketProvider] Socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('[SocketProvider] Connection error:', error.message);
        // If authentication fails, don't retry
        if (error.message.includes('Authentication')) {
          console.error('[SocketProvider] Authentication failed, disconnecting');
          socket.disconnect();
        }
      });

      // Reconnection handler
      socket.io.on('reconnect', (attemptNumber) => {
        console.log('[SocketProvider] Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });
    };

    initializeSocket();

    // Cleanup only on unmount or user logout (not on session object changes)
    return () => {
      if (!socketRef.current) return;
      
      console.log('[SocketProvider] Cleaning up socket connection');
      
      const socket = socketRef.current;
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.io.off('reconnect');
      
      socket.disconnect();
      socketRef.current = null;
    };
  }, [status, userId]); // Only depend on status and stable userId, not full session object

  const value: SocketContextValue = useMemo(
    () => ({
      socket: socketRef.current,
      isConnected,
    }),
    [isConnected]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to access the global socket instance
 * 
 * @throws Error if used outside of SocketProvider
 * 
 * @example
 * ```tsx
 * const { socket, isConnected } = useSocket();
 * 
 * useEffect(() => {
 *   if (!socket) return;
 *   
 *   socket.on('custom_event', handleEvent);
 *   return () => socket.off('custom_event', handleEvent);
 * }, [socket]);
 * ```
 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
}
