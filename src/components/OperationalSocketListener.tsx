'use client';

/**
 * Operational Socket Event Listener
 * 
 * Page-scoped socket event listener for the club operations page.
 * Subscribes to real-time Socket.IO events and:
 * 1. Displays toast notifications via globalNotificationManager
 * 2. Updates Zustand stores (booking store, notification store) with real-time data
 * 3. Transforms Booking/Payment events into AdminNotification format for unified notification system
 * 
 * This component is used ONLY on the club operational page, not globally.
 * 
 * Features:
 * - Page-scoped socket connection (no duplicate connections)
 * - Centralized event dispatching
 * - Automatic duplicate prevention via notification manager
 * - Updates booking store for real-time UI sync
 * - Updates notification store for admin notifications (unified system)
 * - All admin-relevant events (Training, Booking, Payment) persist in notification store
 */

import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type {
  BookingCreatedEvent,
  BookingUpdatedEvent,
  BookingDeletedEvent,
  SlotLockedEvent,
  SlotUnlockedEvent,
  LockExpiredEvent,
  PaymentConfirmedEvent,
  PaymentFailedEvent,
  AdminNotificationEvent,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/types/socket';
import { 
  handleSocketEvent, 
  transformBookingCreated,
  transformBookingUpdated,
  transformBookingCancelled,
  transformPaymentConfirmed,
  transformPaymentFailed,
} from '@/utils/globalNotificationManager';
import { useBookingStore } from '@/stores/useBookingStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface OperationalSocketListenerProps {
  /**
   * The socket instance to listen to events on
   */
  socket: TypedSocket | null;
}

/**
 * Operational Socket Event Listener
 * 
 * Usage: Add this component to the operational page to enable:
 * - Socket event listening
 * - Toast notifications
 * - Automatic store updates
 */
export function OperationalSocketListener({ socket }: OperationalSocketListenerProps) {
  const updateBookingFromSocket = useBookingStore(state => state.updateBookingFromSocket);
  const removeBookingFromSocket = useBookingStore(state => state.removeBookingFromSocket);
  const addLockedSlot = useBookingStore(state => state.addLockedSlot);
  const removeLockedSlot = useBookingStore(state => state.removeLockedSlot);
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    if (!socket) return;

    console.log('[OperationalSocketListener] Registering event listeners');

    // Booking events - handle both notifications and store updates
    const handleBookingCreated = (data: BookingCreatedEvent) => {
      // Show toast notification
      handleSocketEvent('booking_created', data);
      
      // Update booking store for real-time calendar sync
      updateBookingFromSocket(data.booking);
      
      // Add to notification store for admin notification UI
      const notification = transformBookingCreated(data);
      addNotification(notification);
      
      console.log('[OperationalSocketListener] Booking created - toast shown, store updated, notification added');
    };

    const handleBookingUpdated = (data: BookingUpdatedEvent) => {
      // Show toast notification
      handleSocketEvent('booking_updated', data);
      
      // Update booking store for real-time calendar sync
      updateBookingFromSocket(data.booking);
      
      // Add to notification store for admin notification UI
      const notification = transformBookingUpdated(data);
      addNotification(notification);
      
      console.log('[OperationalSocketListener] Booking updated - toast shown, store updated, notification added');
    };

    const handleBookingCancelled = (data: BookingDeletedEvent) => {
      // Show toast notification
      handleSocketEvent('booking_cancelled', data);
      
      // Remove from booking store for real-time calendar sync
      removeBookingFromSocket(data.bookingId);
      
      // Add to notification store for admin notification UI
      const notification = transformBookingCancelled(data);
      addNotification(notification);
      
      console.log('[OperationalSocketListener] Booking cancelled - toast shown, store updated, notification added');
    };

    // Payment events - integrated with unified notification system
    const handlePaymentConfirmed = (data: PaymentConfirmedEvent) => {
      // Show toast notification
      handleSocketEvent('payment_confirmed', data);
      
      // Add to notification store for admin notification UI
      const notification = transformPaymentConfirmed(data);
      addNotification(notification);
      
      console.log('[OperationalSocketListener] Payment confirmed - toast shown, notification added');
    };

    const handlePaymentFailed = (data: PaymentFailedEvent) => {
      // Show toast notification
      handleSocketEvent('payment_failed', data);
      
      // Add to notification store for admin notification UI
      const notification = transformPaymentFailed(data);
      addNotification(notification);
      
      console.log('[OperationalSocketListener] Payment failed - toast shown, notification added');
    };

    // Admin notification event - update notification store
    const handleAdminNotification = (data: AdminNotificationEvent) => {
      console.log('[OperationalSocketListener] Admin notification received:', data);
      addNotification(data);
    };

    // Register event listeners
    socket.on('booking_created', handleBookingCreated);
    socket.on('booking_updated', handleBookingUpdated);
    socket.on('booking_cancelled', handleBookingCancelled);
    socket.on('admin_notification', handleAdminNotification);

    // Slot lock events - update booking store for real-time UI sync
    socket.on('slot_locked', (data: SlotLockedEvent) => {
      handleSocketEvent('slot_locked', data);
      addLockedSlot(data);
      console.log('[OperationalSocketListener] Slot locked - toast shown, store updated');
    });

    socket.on('slot_unlocked', (data: SlotUnlockedEvent) => {
      handleSocketEvent('slot_unlocked', data);
      removeLockedSlot(data.slotId);
      console.log('[OperationalSocketListener] Slot unlocked - toast shown, store updated');
    });

    socket.on('lock_expired', (data: LockExpiredEvent) => {
      handleSocketEvent('lock_expired', data);
      removeLockedSlot(data.slotId);
      console.log('[OperationalSocketListener] Lock expired - toast shown, store updated');
    });

    // Payment events with unified notification system
    socket.on('payment_confirmed', handlePaymentConfirmed);
    socket.on('payment_failed', handlePaymentFailed);

    // Cleanup on unmount or socket change
    return () => {
      console.log('[OperationalSocketListener] Cleaning up event listeners');
      
      socket.off('booking_created', handleBookingCreated);
      socket.off('booking_updated', handleBookingUpdated);
      socket.off('booking_cancelled', handleBookingCancelled);
      socket.off('admin_notification', handleAdminNotification);
      socket.off('slot_locked');
      socket.off('slot_unlocked');
      socket.off('lock_expired');
      socket.off('payment_confirmed', handlePaymentConfirmed);
      socket.off('payment_failed', handlePaymentFailed);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]); // Zustand store functions are stable and excluded from dependencies

  // This component doesn't render anything
  return null;
}
