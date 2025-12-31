"use client";

import { Card } from "@/components/ui";
import { useTranslations } from "next-intl";

interface UploadedFile {
  url: string;
  key: string;
  file?: File;
  preview?: string;
}

interface BannerFormData {
  heroImage: UploadedFile | null;
  bannerAlignment?: 'top' | 'center' | 'bottom';
}

interface BannerStepProps {
  formData: unknown;
  fieldErrors: Record<string, string>;
  isSubmitting: boolean;
  onChange: ((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | ((field: string, value: UploadedFile | null | boolean | string) => void);
  translationNamespace?: string;
}

export function BannerStep({ formData, fieldErrors, isSubmitting, onChange, translationNamespace = "organizations.stepper" }: BannerStepProps) {
  const t = useTranslations(translationNamespace);

  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">{t("bannerTitle")}</h2>
      <p className="im-stepper-section-description">
        {t("bannerDescription")}
      </p>
      <div className="im-step-content">
        <div className="im-stepper-row">
          <div className="im-stepper-field im-stepper-field--full">
            <p className="im-upload-field-helper">
              Banner upload and management will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
