"use client";

import { CourtCard } from "./CourtCard";
import { AdminCourtDetails } from "./AdminCourtDetails";
import type { Court } from "@/types/court";

interface AdminCourtCardProps {
  court: Court;
  clubId: string;
  clubName: string;
  orgName?: string;
  isActive?: boolean;
  onViewDetails?: (courtId: string) => void;
  onEdit?: (courtId: string) => void;
  onDelete?: (courtId: string) => void;
  showOrganization?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

/**
 * AdminCourtCard - Wrapper component for admin pages
 * 
 * Combines the client-facing CourtCard with admin-only details (AdminCourtDetails).
 * This component should be used in admin pages where court management capabilities
 * are needed alongside the basic court information.
 * 
 * @param court - The court object to display
 * @param clubId - ID of the club this court belongs to
 * @param clubName - Name of the club (displayed in admin details)
 * @param orgName - Optional organization name (displayed if showOrganization is true)
 * @param isActive - Whether the court is currently active (default: true)
 * @param onViewDetails - Callback when "View Details" is clicked
 * @param onEdit - Callback when "Edit" button is clicked
 * @param onDelete - Callback when "Delete" button is clicked
 * @param showOrganization - Whether to show organization information (default: true)
 * @param canEdit - Whether to show the Edit button (default: true)
 * @param canDelete - Whether to show the Delete button (default: false)
 * 
 * @example
 * ```tsx
 * <AdminCourtCard
 *   court={courtData}
 *   clubId="club-123"
 *   clubName="Tennis Club"
 *   orgName="Sports Organization"
 *   isActive={true}
 *   onViewDetails={(id) => router.push(`/admin/courts/${id}`)}
 *   onEdit={(id) => handleEdit(id)}
 *   onDelete={(id) => handleDelete(id)}
 *   canEdit={true}
 *   canDelete={true}
 * />
 * ```
 */
export function AdminCourtCard({
  court,
  clubId,
  clubName,
  orgName,
  isActive = true,
  onViewDetails,
  onEdit,
  onDelete,
  showOrganization = true,
  canEdit = true,
  canDelete = false,
}: AdminCourtCardProps) {
  return (
    <div className="flex flex-col">
      <CourtCard
        court={court}
        showBookButton={false}
        showViewSchedule={false}
        showViewDetails={!!onViewDetails}
        onViewDetails={onViewDetails}
        showLegend={false}
        showAvailabilitySummary={false}
        showDetailedAvailability={false}
      />
      
      <AdminCourtDetails
        courtId={court.id}
        clubId={clubId}
        clubName={clubName}
        orgName={orgName}
        isActive={isActive}
        onEdit={onEdit}
        onDelete={onDelete}
        showOrganization={showOrganization}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
