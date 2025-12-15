"use client";

import { useEffect, use, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui";
import { CreateAdminWizard } from "@/components/admin/admin-wizard";
import { useUserStore } from "@/stores/useUserStore";
import { useClubStore } from "@/stores/useClubStore";
import { PageHeaderSkeleton } from "@/components/ui/skeletons";
import type { CreateAdminWizardConfig } from "@/types/adminWizard";

/**
 * Create Admin Page (Club Context)
 * 
 * This page allows admins to create club admins for a specific club.
 * Both the organization and club are pre-selected and cannot be changed.
 */
export default function CreateClubAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clubId } = use(params);
  const router = useRouter();
  const { status } = useSession();
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const hasAnyRole = useUserStore((state) => state.hasAnyRole);
  const isOrgAdmin = useUserStore((state) => state.isOrgAdmin);
  
  const [clubOrgId, setClubOrgId] = useState<string>("");
  const getClubById = useClubStore((state) => state.getClubById);

  // Fetch club to get organization ID
  useEffect(() => {
    const fetchClub = async () => {
      const club = await getClubById(clubId);
      if (club) {
        setClubOrgId(club.organizationId);
      }
    };
    fetchClub();
  }, [clubId, getClubById]);

  useEffect(() => {
    if (!isHydrated) return;

    if (status === "loading") return;

    // Check if user has permission to create admins for this club
    if (!user || !hasAnyRole(["ROOT_ADMIN", "ORGANIZATION_ADMIN"])) {
      router.push("/auth/sign-in");
      return;
    }

    // If org admin, check if they manage the club's organization
    if (!user.isRoot && clubOrgId && !isOrgAdmin(clubOrgId)) {
      router.push("/admin/dashboard");
      return;
    }
  }, [user, status, router, isHydrated, hasAnyRole, isOrgAdmin, clubOrgId]);

  const isLoading = !isHydrated || status === "loading" || !clubOrgId;

  if (isLoading) {
    return (
      <main className="im-admin-page">
        <PageHeaderSkeleton showDescription />
      </main>
    );
  }

  const wizardConfig: CreateAdminWizardConfig = {
    context: "club",
    defaultOrgId: clubOrgId,
    defaultClubId: clubId,
    allowedRoles: ["CLUB_ADMIN"], // Only club admin role when creating from club context
    onSuccess: () => {
      router.push(`/admin/clubs/${clubId}`);
    },
    onCancel: () => {
      router.push(`/admin/clubs/${clubId}`);
    },
  };

  return (
    <main className="im-admin-page">
      <PageHeader
        title="Create Club Admin"
        description="Add a new administrator for this club"
      />

      <section className="rsp-content">
        <CreateAdminWizard config={wizardConfig} />
      </section>
    </main>
  );
}
