"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, Button } from "@/components/ui";

interface UploadedFile {
  url: string;
  key: string;
  file?: File;
  preview?: string;
}

export interface LogoData {
  logoCount: 'one' | 'two';
  logo: UploadedFile | null;
  logoTheme: 'light' | 'dark';
  secondLogo: UploadedFile | null;
  secondLogoTheme: 'light' | 'dark';
}

interface LogoTabProps {
  initialData: LogoData;
  onSave: (files: { logo?: File | null; secondLogo?: File | null; metadata: Record<string, unknown> }) => Promise<void>;
  disabled?: boolean;
  translationNamespace?: string;
}

export function LogoTab({ initialData, onSave, disabled = false, translationNamespace = "organizations.tabs" }: LogoTabProps) {
  const t = useTranslations(translationNamespace);

  return (
    <Card className="im-entity-tab-card">
      <div className="im-entity-tab-header">
        <div>
          <h3 className="im-entity-tab-title">{t("logo.title")}</h3>
          <p className="im-entity-tab-description">{t("logo.description")}</p>
        </div>
      </div>

      <div className="im-entity-tab-content">
        <div className="im-entity-tab-field">
          <p className="im-field-hint">
            Logo upload and management will be available in a future update.
          </p>
        </div>
      </div>
    </Card>
  );
}
