"use client";

import { Card } from "@/components/ui";
import { UploadField } from "../UploadField.client";
import { useTranslations } from "next-intl";

interface UploadedFile {
  url: string;
  key: string;
  file?: File;
  preview?: string;
}

interface ImagesStepProps {
  formData: {
    logo: UploadedFile | null;
    heroImage: UploadedFile | null;
  };
  fieldErrors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (field: 'logo' | 'heroImage', value: UploadedFile | null) => void;
}

export function ImagesStep({ formData, fieldErrors, isSubmitting, onChange }: ImagesStepProps) {
  const t = useTranslations("organizations.stepper");

  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">{t("imagesTitle")}</h2>
      <p className="im-stepper-section-description">
        {t("imagesDescription")}
      </p>
      <div className="im-step-content">
        <div className="im-stepper-row">
          <div className="im-stepper-field im-stepper-field--full">
            <UploadField
              label={t("organizationLogo")}
              value={formData.logo}
              onChange={(file) => onChange('logo', file)}
              aspectRatio="square"
              helperText={t("logoHelperText")}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="im-stepper-row">
          <div className="im-stepper-field im-stepper-field--full">
            <UploadField
              label={t("backgroundImage")}
              value={formData.heroImage}
              onChange={(file) => onChange('heroImage', file)}
              aspectRatio="wide"
              required
              helperText={t("backgroundHelperText")}
              disabled={isSubmitting}
            />
            {fieldErrors.heroImage && (
              <span className="im-stepper-field-error">{fieldErrors.heroImage}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
