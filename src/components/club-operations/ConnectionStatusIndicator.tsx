/**
 * ConnectionStatusIndicator Component
 * 
 * Displays the WebSocket connection status on the Operations page.
 * Shows a subtle indicator when disconnected to alert admins.
 * 
 * Features:
 * - Shows connection state (connected/disconnected)
 * - Subtle design that doesn't interfere with page layout
 * - Auto-hides when connected
 * - Shows reconnection state
 * 
 * Usage:
 * ```tsx
 * <ConnectionStatusIndicator
 *   isConnected={isConnected}
 *   isConnecting={isConnecting}
 * />
 * ```
 */

"use client";

import React from "react";
import "./ConnectionStatusIndicator.css";

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string | null;
}

export function ConnectionStatusIndicator({
  isConnected,
  isConnecting,
  error,
}: ConnectionStatusIndicatorProps) {
  // Don't show anything when connected
  if (isConnected) {
    return null;
  }

  return (
    <div className="im-connection-status">
      <div className="im-connection-status-content">
        {isConnecting ? (
          <>
            <div className="im-connection-status-icon im-connection-status-icon-connecting" />
            <span className="im-connection-status-text">
              Connecting to real-time updates...
            </span>
          </>
        ) : (
          <>
            <div className="im-connection-status-icon im-connection-status-icon-disconnected" />
            <span className="im-connection-status-text">
              {error ? `Connection error: ${error}` : "Disconnected from real-time updates"}
            </span>
            <span className="im-connection-status-subtext">
              Data may not be up to date
            </span>
          </>
        )}
      </div>
    </div>
  );
}
