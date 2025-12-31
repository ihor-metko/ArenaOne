"use client";

import { Card } from "@/components/ui";
import { useTranslations } from "next-intl";
import "./LogoStep.css";

interface UploadedFile {
  url: string;
  key: string;
  file?: File;
  preview?: string;
}

interface LogoFormData {
  logoCount: 'one' | 'two';
  logo: UploadedFile | null;
  logoTheme: 'light' | 'dark';
  logoBackground: 'light' | 'dark';
  secondLogo: UploadedFile | null;
  secondLogoTheme: 'light' | 'dark';
}

interface LogoStepProps {
  formData: unknown;
  fieldErrors: Record<string, string>;
  isSubmitting: boolean;
  onChange: ((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | ((field: string, value: UploadedFile | null | boolean | string) => void);
  translationNamespace?: string;
}

export function LogoStep({ formData, fieldErrors, isSubmitting, onChange, translationNamespace = "organizations.stepper" }: LogoStepProps) {
  const t = useTranslations(translationNamespace);

  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">{t("logoTitle")}</h2>
      <p className="im-stepper-section-description">
        {t("logoDescription")}
      </p>
      <div className="im-step-content">
        <div className="im-stepper-row">
          <div className="im-stepper-field im-stepper-field--full">
            <p className="im-upload-field-helper">
              Logo upload and management will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
