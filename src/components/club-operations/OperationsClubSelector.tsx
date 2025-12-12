"use client";

import { useState, useEffect, useMemo } from "react";
import { Select, type SelectOption } from "@/components/ui";
import { useClubStore } from "@/stores/useClubStore";
import { useUserStore } from "@/stores/useUserStore";

interface OperationsClubSelectorProps {
  /** Currently selected club ID */
  value: string;
  /** Callback when club selection changes */
  onChange: (clubId: string) => void;
  /** Label for the select */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** If true, the selector is disabled (e.g., for Club Admins) */
  disabled?: boolean;
}

/**
 * Club selector component specifically for the Operations page.
 * 
 * Features:
 * - Automatically fetches clubs from store
 * - Filters clubs based on user role:
 *   - Root Admin: Shows all clubs
 *   - Organization Admin: Shows only clubs in their organizations
 *   - Club Admin: Should be disabled (already has assigned club)
 * - Standalone component (doesn't require list controller)
 * 
 * @example
 * ```tsx
 * <OperationsClubSelector 
 *   value={selectedClubId}
 *   onChange={setSelectedClubId}
 *   label="Club"
 *   placeholder="Select a club"
 * />
 * ```
 */
export function OperationsClubSelector({
  value,
  onChange,
  label = "Club",
  placeholder = "Select a club",
  className = "",
  disabled = false,
}: OperationsClubSelectorProps) {
  // Get clubs from store
  const clubs = useClubStore((state) => state.clubs);
  const fetchClubsIfNeeded = useClubStore((state) => state.fetchClubsIfNeeded);
  const loading = useClubStore((state) => state.loadingClubs);
  const currentClub = useClubStore((state) => state.currentClub);
  const setCurrentClub = useClubStore((state) => state.setCurrentClub);

  // Get user info for filtering
  const adminStatus = useUserStore((state) => state.adminStatus);
  const user = useUserStore((state) => state.user);

  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch clubs on mount
  useEffect(() => {
    if (!hasInitialized) {
      fetchClubsIfNeeded().catch((error) => {
        console.error("Failed to fetch clubs:", error);
      });
      setHasInitialized(true);
    }
  }, [hasInitialized, fetchClubsIfNeeded]);

  // Filter clubs based on user role
  const filteredClubs = useMemo(() => {
    // Root admins see all clubs
    if (user?.isRoot) {
      return clubs;
    }

    // Organization admins see only clubs in their managed organizations
    if (adminStatus?.adminType === "organization_admin") {
      const managedOrgIds = new Set(adminStatus.managedIds);
      return clubs.filter((club) => managedOrgIds.has(club.organizationId));
    }

    // Club admins should only see their assigned club(s)
    if (adminStatus?.adminType === "club_admin") {
      const managedClubIds = new Set(adminStatus.managedIds);
      return clubs.filter((club) => managedClubIds.has(club.id));
    }

    // Default: no clubs (user is not an admin)
    return [];
  }, [clubs, adminStatus, user]);

  // Pre-select currentClub from store if available and not disabled
  useEffect(() => {
    if (currentClub && !value && !disabled && filteredClubs.some(c => c.id === currentClub.id)) {
      // If there's a currentClub in the store and no selection yet, use it
      onChange(currentClub.id);
    }
  }, [currentClub, value, disabled, filteredClubs, onChange]);

  // Auto-select if Org Admin has only one club
  // Note: Club Admins are handled in the Operations page itself (auto-select on mount)
  // This only applies to Org Admins who have exactly one club in their organization
  useEffect(() => {
    if (
      adminStatus?.adminType === "organization_admin" &&
      filteredClubs.length === 1 &&
      !value &&
      !disabled
    ) {
      // Auto-select the only available club for convenience
      onChange(filteredClubs[0].id);
    }
  }, [adminStatus, filteredClubs, value, onChange, disabled]);

  // Convert clubs to select options
  const options: SelectOption[] = filteredClubs.map((club) => ({
    value: club.id,
    label: club.name,
  }));

  // Clear selection if selected club is no longer in filtered list
  useEffect(() => {
    if (value && !filteredClubs.find((club) => club.id === value)) {
      onChange("");
    }
  }, [value, filteredClubs, onChange]);

  // Handle club selection - update both local state and store
  const handleClubChange = (clubId: string) => {
    onChange(clubId);
    
    // Update store's currentClub for persistence
    if (clubId) {
      const selectedClub = filteredClubs.find(c => c.id === clubId);
      if (selectedClub) {
        // Note: ClubWithCounts can be used as ClubDetail since it has all required fields
        // TypeScript needs explicit cast since they're different interfaces
        setCurrentClub(selectedClub as unknown as typeof currentClub);
      }
    } else {
      setCurrentClub(null);
    }
  };

  // Determine placeholder based on state
  const getPlaceholder = () => {
    if (loading) {
      return "Loading clubs...";
    }
    if (filteredClubs.length === 0) {
      return "No clubs available for this organization";
    }
    return placeholder;
  };

  return (
    <Select
      label={label}
      options={options}
      value={value}
      onChange={handleClubChange}
      placeholder={getPlaceholder()}
      disabled={disabled || loading || filteredClubs.length === 0}
      className={className}
      aria-label={label}
    />
  );
}
