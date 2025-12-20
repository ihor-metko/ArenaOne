'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  BookingCreatedEvent,
  BookingUpdatedEvent,
  BookingDeletedEvent,
} from '@/types/socket';

/**
 * Typed Socket.IO client
 */
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Hook options
 */
interface UseSocketIOOptions {
  /**
   * Whether to automatically connect on mount
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Callback when a booking is created
   */
  onBookingCreated?: (data: BookingCreatedEvent) => void;

  /**
   * Callback when a booking is updated
   */
  onBookingUpdated?: (data: BookingUpdatedEvent) => void;

  /**
   * Callback when a booking is deleted
   */
  onBookingDeleted?: (data: BookingDeletedEvent) => void;
}

/**
 * Hook return type
 */
interface UseSocketIOReturn {
  /**
   * Socket.IO client instance
   */
  socket: TypedSocket | null;

  /**
   * Whether the socket is connected
   */
  isConnected: boolean;

  /**
   * Manually connect the socket
   */
  connect: () => void;

  /**
   * Manually disconnect the socket
   */
  disconnect: () => void;
}

/**
 * Custom hook for Socket.IO client connection
 * 
 * @example
 * ```tsx
 * const { socket, isConnected } = useSocketIO({
 *   onBookingCreated: (data) => {
 *     console.log('New booking created:', data);
 *     // Refresh bookings list
 *   },
 *   onBookingUpdated: (data) => {
 *     console.log('Booking updated:', data);
 *   },
 * });
 * ```
 */
export function useSocketIO(options: UseSocketIOOptions = {}): UseSocketIOReturn {
  const {
    autoConnect = true,
    onBookingCreated,
    onBookingUpdated,
    onBookingDeleted,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Initialize Socket.IO client
    const socket: TypedSocket = io({
      path: '/socket.io',
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
    });

    // Booking event handlers
    if (onBookingCreated) {
      socket.on('bookingCreated', onBookingCreated);
    }

    if (onBookingUpdated) {
      socket.on('bookingUpdated', onBookingUpdated);
    }

    if (onBookingDeleted) {
      socket.on('bookingDeleted', onBookingDeleted);
    }

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      if (onBookingCreated) socket.off('bookingCreated');
      if (onBookingUpdated) socket.off('bookingUpdated');
      if (onBookingDeleted) socket.off('bookingDeleted');
      socket.disconnect();
    };
  }, [autoConnect, onBookingCreated, onBookingUpdated, onBookingDeleted]);

  const connect = () => {
    if (!socketRef.current) {
      const socket: TypedSocket = io({
        path: '/socket.io',
      });
      socketRef.current = socket;
    } else if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
  };
}
