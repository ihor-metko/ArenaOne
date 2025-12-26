"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, Button, RadioGroup } from "@/components/ui";
import { UploadField } from "@/components/admin/UploadField.client";

interface UploadedFile {
  url: string;
  key: string;
  file?: File;
  preview?: string;
}

export type BannerAlignment = 'top' | 'center' | 'bottom';

export interface BannerData {
  heroImage: UploadedFile | null;
  bannerAlignment?: BannerAlignment;
}

interface BannerTabProps {
  initialData: BannerData;
  onSave: (file: File | null, alignment: BannerAlignment) => Promise<void>;
  disabled?: boolean;
  translationNamespace?: string;
}

export function BannerTab({ initialData, onSave, disabled = false, translationNamespace = "organizations.tabs" }: BannerTabProps) {
  const t = useTranslations(translationNamespace);
  const [formData, setFormData] = useState<BannerData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = useCallback((file: UploadedFile | null) => {
    setFormData(prev => ({ ...prev, heroImage: file }));
    setHasChanges(true);
  }, []);

  const handleAlignmentChange = useCallback((alignment: string) => {
    setFormData(prev => ({ ...prev, bannerAlignment: alignment as BannerAlignment }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave(
        formData.heroImage?.file || null,
        formData.bannerAlignment || 'center'
      );
      setHasChanges(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.saveFailed");
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="im-entity-tab-card">
      <div className="im-entity-tab-header">
        <div>
          <h3 className="im-entity-tab-title">{t("banner.title")}</h3>
          <p className="im-entity-tab-description">{t("banner.description")}</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || disabled}
          variant="primary"
        >
          {isSaving ? t("common.saving") : t("common.save")}
        </Button>
      </div>

      {error && (
        <div className="im-entity-tab-error" role="alert">
          {error}
        </div>
      )}

      <div className="im-entity-tab-content">
        {formData.heroImage && (
          <div className="im-entity-tab-field">
            <RadioGroup
              label={t("banner.alignment")}
              name="bannerAlignment"
              value={formData.bannerAlignment || 'center'}
              onChange={handleAlignmentChange}
              disabled={isSaving || disabled}
              options={[
                {
                  value: 'top',
                  label: t("banner.alignmentTop"),
                  description: t("banner.alignmentTopDesc")
                },
                {
                  value: 'center',
                  label: t("banner.alignmentCenter"),
                  description: t("banner.alignmentCenterDesc")
                },
                {
                  value: 'bottom',
                  label: t("banner.alignmentBottom"),
                  description: t("banner.alignmentBottomDesc")
                }
              ]}
            />
          </div>
        )}

        <div className="im-entity-tab-field">
          <UploadField
            label={t("banner.heroImage")}
            value={formData.heroImage}
            onChange={handleChange}
            aspectRatio="wide"
            helperText={t("banner.heroImageHelperText")}
            disabled={isSaving || disabled}
            allowSVG={false}
          />
        </div>
      </div>
    </Card>
  );
}
