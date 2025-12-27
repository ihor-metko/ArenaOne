"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui";
import type { NewUserData, AdminWizardErrors } from "@/types/adminWizard";

interface UserDataStepProps {
  data: Partial<NewUserData>;
  onChange: (data: Partial<NewUserData>) => void;
  errors: AdminWizardErrors;
  disabled: boolean;
}

export function UserDataStep({
  data,
  onChange,
  errors,
  disabled,
}: UserDataStepProps) {
  const t = useTranslations("createAdminWizard.userDataStep");
  
  return (
    <div className="im-wizard-step-content">
      <p className="im-field-hint im-mb-4">
        {t("newUserHint")}
      </p>
      
      <div className="im-form-field">
        <Input
          id="name"
          label={t("fullName")}
          type="text"
          value={data.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t("fullNamePlaceholder")}
          disabled={disabled}
          required={false}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <span id="name-error" className="im-field-error" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div className="im-form-field">
        <Input
          id="email"
          label={t("email")}
          type="email"
          value={data.email || ""}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder={t("emailPlaceholder")}
          disabled={disabled}
          required
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <span id="email-error" className="im-field-error" role="alert">
            {errors.email}
          </span>
        )}
        <p className="im-field-hint">
          {t("emailHint")}
        </p>
      </div>

      <div className="im-form-field">
        <Input
          id="phone"
          label={t("phone")}
          type="tel"
          value={data.phone || ""}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder={t("phonePlaceholder")}
          disabled={disabled}
          required={false}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
        {errors.phone && (
          <span id="phone-error" className="im-field-error" role="alert">
            {errors.phone}
          </span>
        )}
        <p className="im-field-hint">
          {t("phoneHint")}
        </p>
      </div>
    </div>
  );
}
