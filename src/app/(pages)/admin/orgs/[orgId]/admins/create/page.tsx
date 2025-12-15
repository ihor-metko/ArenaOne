"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui";
import { CreateAdminWizard } from "@/components/admin/admin-wizard";
import { useUserStore } from "@/stores/useUserStore";
import { PageHeaderSkeleton } from "@/components/ui/skeletons";
import type { CreateAdminWizardConfig } from "@/types/adminWizard";

/**
 * Create Admin Page (Organization Context)
 * 
 * This page allows admins to create admins for a specific organization.
 * The organization is pre-selected and cannot be changed.
 */
export default function CreateOrgAdminPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();
  const { status } = useSession();
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const hasAnyRole = useUserStore((state) => state.hasAnyRole);
  const isOrgAdmin = useUserStore((state) => state.isOrgAdmin);

  useEffect(() => {
    if (!isHydrated) return;

    if (status === "loading") return;

    // Check if user has permission to create admins for this org
    if (!user || !hasAnyRole(["ROOT_ADMIN", "ORGANIZATION_ADMIN"])) {
      router.push("/auth/sign-in");
      return;
    }

    // If org admin, check if they manage this specific org
    if (!user.isRoot && !isOrgAdmin(orgId)) {
      router.push("/admin/dashboard");
      return;
    }
  }, [user, status, router, isHydrated, hasAnyRole, isOrgAdmin, orgId]);

  const isLoading = !isHydrated || status === "loading";

  if (isLoading) {
    return (
      <main className="im-admin-page">
        <PageHeaderSkeleton showDescription />
      </main>
    );
  }

  const wizardConfig: CreateAdminWizardConfig = {
    context: "organization",
    defaultOrgId: orgId,
    allowedRoles: ["ORGANIZATION_ADMIN", "CLUB_ADMIN"],
    onSuccess: (userId) => {
      router.push(`/admin/orgs/${orgId}/dashboard`);
    },
    onCancel: () => {
      router.push(`/admin/orgs/${orgId}/dashboard`);
    },
  };

  return (
    <main className="im-admin-page">
      <PageHeader
        title="Create Admin"
        description="Add a new administrator for this organization"
      />

      <section className="rsp-content">
        <CreateAdminWizard config={wizardConfig} />
      </section>
    </main>
  );
}
