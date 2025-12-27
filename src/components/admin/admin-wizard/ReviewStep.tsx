"use client";

import { useTranslations } from "next-intl";
import type { AdminCreationData, OrganizationOption, ClubOption } from "@/types/adminWizard";

interface ReviewStepProps {
  data: AdminCreationData;
  organizations: OrganizationOption[];
  clubs: ClubOption[];
}

export function ReviewStep({
  data,
  organizations,
  clubs,
}: ReviewStepProps) {
  const t = useTranslations("createAdminWizard.reviewStep");
  const tContext = useTranslations("createAdminWizard.contextStep");
  
  const organization = organizations.find(org => org.id === data.organizationId);
  const club = data.clubId ? clubs.find(c => c.id === data.clubId) : null;
  
  let roleLabel = "";
  let actionText = "";
  
  switch (data.role) {
    case "ORGANIZATION_OWNER":
      roleLabel = tContext("roles.organizationOwner");
      break;
    case "ORGANIZATION_ADMIN":
      roleLabel = tContext("roles.organizationAdmin");
      break;
    case "CLUB_OWNER":
      roleLabel = tContext("roles.clubOwner");
      break;
    case "CLUB_ADMIN":
      roleLabel = tContext("roles.clubAdmin");
      break;
    default:
      roleLabel = data.role;
  }

  if (data.userSource === "existing") {
    actionText = t("actionExisting");
  } else {
    actionText = t("actionNew");
  }

  return (
    <div className="im-wizard-step-content">
      <div className="im-review-section">
        <h3 className="im-review-section-title">{t("adminContext")}</h3>
        <dl className="im-review-list">
          <div className="im-review-item">
            <dt className="im-review-label">{t("organization")}</dt>
            <dd className="im-review-value">{organization?.name || t("notSelected")}</dd>
          </div>
          {club && (
            <div className="im-review-item">
              <dt className="im-review-label">{t("club")}</dt>
              <dd className="im-review-value">{club.name}</dd>
            </div>
          )}
          <div className="im-review-item">
            <dt className="im-review-label">{t("role")}</dt>
            <dd className="im-review-value">
              <span className="im-review-badge im-review-badge--role">
                {roleLabel}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="im-review-section">
        <h3 className="im-review-section-title">{t("userInformation")}</h3>
        <dl className="im-review-list">
          <div className="im-review-item">
            <dt className="im-review-label">{t("userSource")}</dt>
            <dd className="im-review-value">
              {data.userSource === "existing" ? t("existingUser") : t("newUser")}
            </dd>
          </div>
          <div className="im-review-item">
            <dt className="im-review-label">{t("fullName")}</dt>
            <dd className="im-review-value">{data.name || t("na")}</dd>
          </div>
          <div className="im-review-item">
            <dt className="im-review-label">{t("email")}</dt>
            <dd className="im-review-value">{data.email || t("na")}</dd>
          </div>
          {data.userSource === "new" && data.phone && (
            <div className="im-review-item">
              <dt className="im-review-label">{t("phone")}</dt>
              <dd className="im-review-value">{data.phone}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="im-review-note">
        <p>
          <strong>{t("actionLabel")}</strong> {actionText}
        </p>
      </div>
    </div>
  );
}
