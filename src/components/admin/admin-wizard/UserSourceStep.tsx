"use client";

import { useTranslations } from "next-intl";
import type { UserSourceData, UserSource, AdminWizardErrors } from "@/types/adminWizard";

interface UserSourceStepProps {
  data: UserSourceData;
  onChange: (data: Partial<UserSourceData>) => void;
  errors: AdminWizardErrors;
  disabled: boolean;
}

export function UserSourceStep({
  data,
  onChange,
  errors,
  disabled,
}: UserSourceStepProps) {
  const t = useTranslations("createAdminWizard.userSourceStep");
  
  const handleSourceChange = (source: UserSource) => {
    onChange({ userSource: source });
  };

  return (
    <div className="im-wizard-step-content">
      <div className="im-form-field">
        <label className="im-field-label">
          {t("label")}
        </label>
        <div className="im-radio-group">
          <label className="im-radio-option">
            <input
              type="radio"
              name="userSource"
              value="existing"
              checked={data.userSource === "existing"}
              onChange={() => handleSourceChange("existing")}
              disabled={disabled}
              className="im-radio-input"
            />
            <span className="im-radio-label-content">
              <span className="im-radio-label-title">{t("existing.title")}</span>
              <span className="im-radio-label-description">
                {t("existing.description")}
              </span>
            </span>
          </label>
          
          <label className="im-radio-option">
            <input
              type="radio"
              name="userSource"
              value="new"
              checked={data.userSource === "new"}
              onChange={() => handleSourceChange("new")}
              disabled={disabled}
              className="im-radio-input"
            />
            <span className="im-radio-label-content">
              <span className="im-radio-label-title">{t("new.title")}</span>
              <span className="im-radio-label-description">
                {t("new.description")}
              </span>
            </span>
          </label>
        </div>
        {errors.userSource && (
          <span className="im-field-error" role="alert">
            {errors.userSource}
          </span>
        )}
      </div>
    </div>
  );
}
