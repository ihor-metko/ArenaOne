"use client";

import { useTranslations } from "next-intl";
import { Select } from "@/components/ui";
import type { WizardClub, WizardStepClub } from "./types";

interface Step2ClubProps {
  data: WizardStepClub;
  clubs: WizardClub[];
  isLoading: boolean;
  error: string | null;
  onSelect: (club: WizardClub) => void;
}

export function Step2Club({
  data,
  clubs,
  isLoading,
  error,
  onSelect,
}: Step2ClubProps) {
  const t = useTranslations();

  const handleChange = (clubId: string) => {
    const club = clubs.find((c) => c.id === clubId);
    if (club) {
      onSelect(club);
    }
  };

  return (
    <div className="rsp-admin-wizard-step">
      <div className="rsp-admin-wizard-step-header">
        <h3 className="rsp-admin-wizard-step-title">
          {t("adminWizard.selectClub")}
        </h3>
        <p className="rsp-admin-wizard-step-description">
          {t("adminWizard.selectClubDescription")}
        </p>
      </div>

      <div className="rsp-admin-wizard-step-content">
        {error ? (
          <div className="rsp-admin-wizard-error" role="alert">
            {error}
          </div>
        ) : isLoading ? (
          <div className="rsp-admin-wizard-loading">
            <div className="rsp-admin-wizard-loading-spinner" />
            <span>{t("common.loading")}</span>
          </div>
        ) : clubs.length === 0 ? (
          <div className="rsp-admin-wizard-empty">
            <svg
              className="rsp-admin-wizard-empty-icon"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <p className="rsp-admin-wizard-empty-title">{t("adminWizard.noClubsAvailable")}</p>
            <p className="rsp-admin-wizard-empty-description">
              {t("adminWizard.noClubsAvailableHint")}
            </p>
          </div>
        ) : (
          <Select
            id="club-select"
            label={t("adminBookings.club")}
            options={clubs.map((club) => ({
              value: club.id,
              label: club.name,
            }))}
            value={data.selectedClubId || ""}
            onChange={handleChange}
            placeholder={t("adminWizard.selectClubPlaceholder")}
          />
        )}
      </div>
    </div>
  );
}
