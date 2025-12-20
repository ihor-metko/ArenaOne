/**
 * WebSocket Real-time Updates - Testing Example Component
 * 
 * This component demonstrates and tests real-time booking updates
 * across multiple simulated clients. It's useful for:
 * - Manual testing during development
 * - Demonstrating WebSocket functionality
 * - Training/onboarding developers
 * 
 * Usage:
 * 1. Import this component in a test page
 * 2. Open the page in multiple browser tabs
 * 3. Use the controls to simulate booking events
 * 4. Observe real-time updates across all tabs
 */

'use client';

import { useState, useEffect } from 'react';
import { useSocketIO } from '@/hooks/useSocketIO';
import { useBookingStore } from '@/stores/useBookingStore';
import type { OperationsBooking } from '@/types/booking';

interface WebSocketTestingDemoProps {
  /**
   * Club ID to filter events for
   */
  clubId: string;
  
  /**
   * Whether to show debug logs
   */
  showDebugLogs?: boolean;
}

/**
 * Demo component for testing WebSocket real-time updates
 */
export function WebSocketTestingDemo({
  clubId,
  showDebugLogs = true,
}: WebSocketTestingDemoProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [eventCount, setEventCount] = useState({
    created: 0,
    updated: 0,
    deleted: 0,
  });
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const bookings = useBookingStore((state) => state.bookings);
  const fetchBookingsForDay = useBookingStore((state) => state.fetchBookingsForDay);
  const updateBookingFromSocket = useBookingStore(
    (state) => state.updateBookingFromSocket
  );
  const removeBookingFromSocket = useBookingStore(
    (state) => state.removeBookingFromSocket
  );

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  // Set up WebSocket connection
  const { isConnected, socket } = useSocketIO({
    autoConnect: true,
    onBookingCreated: (data) => {
      if (data.clubId === clubId) {
        addLog(`✅ Booking Created: ${data.booking.id} - ${data.booking.courtName}`);
        setEventCount((prev) => ({ ...prev, created: prev.created + 1 }));
        setLastEventTime(new Date());
        updateBookingFromSocket(data.booking);
      } else {
        addLog(`ℹ️ Booking Created (different club): ${data.clubId}`);
      }
    },
    onBookingUpdated: (data) => {
      if (data.clubId === clubId) {
        addLog(
          `🔄 Booking Updated: ${data.booking.id} - ${data.previousStatus} → ${data.booking.bookingStatus}`
        );
        setEventCount((prev) => ({ ...prev, updated: prev.updated + 1 }));
        setLastEventTime(new Date());
        updateBookingFromSocket(data.booking);
      } else {
        addLog(`ℹ️ Booking Updated (different club): ${data.clubId}`);
      }
    },
    onBookingDeleted: (data) => {
      if (data.clubId === clubId) {
        addLog(`🗑️ Booking Deleted: ${data.bookingId}`);
        setEventCount((prev) => ({ ...prev, deleted: prev.deleted + 1 }));
        setLastEventTime(new Date());
        removeBookingFromSocket(data.bookingId);
      } else {
        addLog(`ℹ️ Booking Deleted (different club): ${data.clubId}`);
      }
    },
    onReconnect: () => {
      setReconnectCount((prev) => prev + 1);
      addLog('🔌 Reconnected to server - syncing data...');
      fetchBookingsForDay(clubId, new Date().toISOString().split('T')[0]);
    },
  });

  // Initial fetch
  useEffect(() => {
    fetchBookingsForDay(clubId, new Date().toISOString().split('T')[0]);
  }, [clubId, fetchBookingsForDay]);

  // Manual disconnect/connect handlers
  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
      addLog('🔴 Manually disconnected');
    }
  };

  const handleConnect = () => {
    if (socket) {
      socket.connect();
      addLog('🟢 Manually reconnected');
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleResetStats = () => {
    setEventCount({ created: 0, updated: 0, deleted: 0 });
    setReconnectCount(0);
    setLastEventTime(null);
  };

  return (
    <div className="im-card">
      <div className="im-card-header">
        <h2 className="im-card-title">WebSocket Real-time Updates - Testing Demo</h2>
        <p className="im-card-description">
          Open this page in multiple tabs to test real-time updates
        </p>
      </div>

      <div className="im-card-content space-y-6">
        {/* Connection Status */}
        <div className="im-section">
          <h3 className="im-section-title">Connection Status</h3>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isConnected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              <span className="text-2xl">{isConnected ? '🟢' : '🔴'}</span>
              <span className="font-semibold">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {socket && (
              <div className="text-sm text-gray-400">
                Socket ID: <code className="im-code">{socket.id}</code>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleConnect}
              disabled={isConnected}
              className="im-button im-button-sm"
            >
              Connect
            </button>
            <button
              onClick={handleDisconnect}
              disabled={!isConnected}
              className="im-button im-button-sm im-button-danger"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Event Statistics */}
        <div className="im-section">
          <h3 className="im-section-title">Event Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="im-stat-card">
              <div className="im-stat-value">{eventCount.created}</div>
              <div className="im-stat-label">Created</div>
            </div>
            <div className="im-stat-card">
              <div className="im-stat-value">{eventCount.updated}</div>
              <div className="im-stat-label">Updated</div>
            </div>
            <div className="im-stat-card">
              <div className="im-stat-value">{eventCount.deleted}</div>
              <div className="im-stat-label">Deleted</div>
            </div>
            <div className="im-stat-card">
              <div className="im-stat-value">{reconnectCount}</div>
              <div className="im-stat-label">Reconnects</div>
            </div>
          </div>

          {lastEventTime && (
            <div className="mt-4 text-sm text-gray-400">
              Last event: {lastEventTime.toLocaleTimeString()}
            </div>
          )}

          <button
            onClick={handleResetStats}
            className="im-button im-button-sm mt-4"
          >
            Reset Statistics
          </button>
        </div>

        {/* Current Bookings */}
        <div className="im-section">
          <h3 className="im-section-title">
            Current Bookings ({bookings.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {bookings.length === 0 ? (
              <p className="text-gray-400">No bookings for this club</p>
            ) : (
              bookings.map((booking: OperationsBooking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{booking.courtName}</div>
                    <div className="text-sm text-gray-400">
                      {booking.userName} - {booking.bookingStatus}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.start).toLocaleTimeString()} -{' '}
                    {new Date(booking.end).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Event Logs */}
        {showDebugLogs && (
          <div className="im-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="im-section-title">Event Logs</h3>
              <button
                onClick={handleClearLogs}
                className="im-button im-button-sm"
              >
                Clear Logs
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500">No events logged yet</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-gray-300 py-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Testing Instructions */}
        <div className="im-section">
          <h3 className="im-section-title">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Open this page in 2-3 browser tabs</li>
            <li>
              In another tab, create/update/delete bookings for club: {clubId}
            </li>
            <li>Observe all tabs receiving updates simultaneously</li>
            <li>
              Test reconnection: Use the &quot;Disconnect&quot; button, then &quot;Connect&quot;
            </li>
            <li>
              Check event statistics to verify all events are received
            </li>
            <li>Verify no duplicate bookings appear in the list</li>
          </ol>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              💡 <strong>Tip:</strong> Open browser DevTools Console to see
              additional WebSocket debug logs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Minimal WebSocket Status Indicator
 * 
 * A lightweight component that just shows connection status.
 * Can be added to any page header or toolbar.
 */
export function WebSocketStatusBadge() {
  const { isConnected } = useSocketIO({ autoConnect: true });

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        isConnected
          ? 'bg-green-500/20 text-green-400'
          : 'bg-gray-500/20 text-gray-400'
      }`}
      title={isConnected ? 'Live updates enabled' : 'Connecting...'}
    >
      <span className="text-sm">{isConnected ? '🟢' : '⚪'}</span>
      <span>{isConnected ? 'Live' : 'Offline'}</span>
    </div>
  );
}

/**
 * Example: Auto-refresh on Reconnect
 * 
 * Demonstrates how to automatically refresh data when reconnecting
 */
export function AutoRefreshExample({ clubId }: { clubId: string }) {
  const fetchBookings = useBookingStore((state) => state.fetchBookingsForDay);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useSocketIO({
    autoConnect: true,
    onReconnect: () => {
      // Automatically resync data when reconnected
      const today = new Date().toISOString().split('T')[0];
      fetchBookings(clubId, today);
      setLastSync(new Date());
    },
  });

  return (
    <div className="text-sm text-gray-400">
      {lastSync && `Last sync: ${lastSync.toLocaleTimeString()}`}
    </div>
  );
}
