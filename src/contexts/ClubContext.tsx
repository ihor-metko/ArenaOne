'use client';

/**
 * Club Context
 * 
 * Tracks the currently active/selected club across the application.
 * This is used by the Socket.IO connection to join the correct club room.
 * 
 * Features:
 * - Persists selected clubId in localStorage for page reload restoration
 * - Provides setActiveClubId to update the current club
 * - Used by BookingSocketProvider to determine which club room to join
 * - Does NOT auto-initialize from localStorage to prevent unwanted socket connections
 * 
 * Important: The activeClubId should ONLY be set by the operations page when
 * navigating to a specific club. This ensures BookingSocket connections are
 * intentional and not triggered by stale localStorage data.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Club Context interface
 */
interface ClubContextValue {
  /**
   * Currently active club ID (null if none selected)
   */
  activeClubId: string | null;

  /**
   * Set the active club ID
   */
  setActiveClubId: (clubId: string | null) => void;
}

/**
 * Club Context
 */
const ClubContext = createContext<ClubContextValue | undefined>(undefined);

/**
 * Club Provider Props
 */
interface ClubProviderProps {
  children: React.ReactNode;
}

/**
 * Club Provider
 * 
 * Manages the currently active club for socket room targeting.
 * Persists the selection in localStorage for page reload restoration.
 * 
 * Important: Does NOT auto-restore from localStorage on mount to prevent
 * unwanted BookingSocket connections from stale clubId values. The operations
 * page is responsible for setting activeClubId when navigating to a club.
 * 
 * @example
 * ```tsx
 * <ClubProvider>
 *   <App />
 * </ClubProvider>
 * ```
 */
export function ClubProvider({ children }: ClubProviderProps) {
  const [activeClubId, setActiveClubIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark as hydrated on mount
  // Note: We do NOT restore from localStorage here to prevent unwanted
  // BookingSocket connections from stale clubId. The operations page will
  // set activeClubId explicitly when needed.
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Persist to localStorage when changed
  // Note: localStorage is used ONLY for page reload restoration within the operations
  // page itself. It should NOT trigger automatic socket connections on app start.
  const setActiveClubId = useCallback((clubId: string | null) => {
    setActiveClubIdState(clubId);
    if (clubId) {
      localStorage.setItem('activeClubId', clubId);
      console.log('[ClubContext] Active club set:', clubId);
    } else {
      localStorage.removeItem('activeClubId');
      console.log('[ClubContext] Active club cleared');
    }
  }, []);

  const value: ClubContextValue = useMemo(
    () => ({
      activeClubId: isHydrated ? activeClubId : null,
      setActiveClubId,
    }),
    [activeClubId, setActiveClubId, isHydrated]
  );

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  );
}

/**
 * Hook to access the active club context
 * 
 * @throws Error if used outside of ClubProvider
 * 
 * @example
 * ```tsx
 * const { activeClubId, setActiveClubId } = useActiveClub();
 * 
 * // Set active club when navigating to operations page
 * setActiveClubId(clubId);
 * ```
 */
export function useActiveClub(): ClubContextValue {
  const context = useContext(ClubContext);
  
  if (context === undefined) {
    throw new Error('useActiveClub must be used within a ClubProvider');
  }
  
  return context;
}
