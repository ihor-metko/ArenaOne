"use client";

import UnifiedAdminsTable from "../UnifiedAdminsTable";

interface ClubAdminsSectionProps {
  clubId: string;
  /**
   * Optional club data to avoid fetching when already available
   * Passed from parent to prevent unnecessary network requests
   */
  clubData?: {
    id: string;
    name: string;
    organizationId: string;
  };
}

export function ClubAdminsSection({
  clubId,
  clubData,
}: ClubAdminsSectionProps) {
  return (
    <div className="im-section-card">
      <UnifiedAdminsTable
        containerType="club"
        containerId={clubId}
        containerName={clubData?.name}
        clubData={clubData}
      />
    </div>
  );
}
