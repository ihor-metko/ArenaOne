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

interface BannerFormData {
  heroImage: UploadedFile | null;
}

interface BannerStepProps {
  formData: unknown;
  fieldErrors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (field: string, value: UploadedFile | null) => void;
}

export function BannerStep({ formData, fieldErrors, isSubmitting, onChange }: BannerStepProps) {
  const t = useTranslations("organizations.stepper");
  const data = formData as BannerFormData;

  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">{t("bannerTitle")}</h2>
      <p className="im-stepper-section-description">
        {t("bannerDescription")}
      </p>
      <div className="im-step-content">
        <div className="im-stepper-row">
          <div className="im-stepper-field im-stepper-field--full">
            <UploadField
              label={t("backgroundImage")}
              value={data.heroImage}
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
