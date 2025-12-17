"use client";

import { Input, Card } from "@/components/ui";
import { useTranslations } from "next-intl";

interface AddressStepProps {
  formData: {
    country: string;
    city: string;
    postalCode: string;
    street: string;
    latitude: string;
    longitude: string;
  };
  fieldErrors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function AddressStep({ formData, fieldErrors, isSubmitting, onChange }: AddressStepProps) {
  const t = useTranslations("organizations.stepper");

  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">{t("addressTitle")}</h2>
      <p className="im-stepper-section-description">
        {t("addressDescription")}
      </p>
      <div className="im-step-content">
        <div className="im-stepper-row im-stepper-row--two">
          <div className="im-stepper-field">
            <Input
              label={t("country")}
              name="country"
              value={formData.country}
              onChange={onChange}
              placeholder={t("countryPlaceholder")}
              disabled={isSubmitting}
            />
            {fieldErrors.country && (
              <span className="im-stepper-field-error">{fieldErrors.country}</span>
            )}
          </div>
          <div className="im-stepper-field">
            <Input
              label={t("city")}
              name="city"
              value={formData.city}
              onChange={onChange}
              placeholder={t("cityPlaceholder")}
              disabled={isSubmitting}
            />
            {fieldErrors.city && (
              <span className="im-stepper-field-error">{fieldErrors.city}</span>
            )}
          </div>
        </div>

        <div className="im-stepper-row im-stepper-row--two">
          <div className="im-stepper-field">
            <Input
              label={t("street")}
              name="street"
              value={formData.street}
              onChange={onChange}
              placeholder={t("streetPlaceholder")}
              disabled={isSubmitting}
            />
            {fieldErrors.street && (
              <span className="im-stepper-field-error">{fieldErrors.street}</span>
            )}
          </div>
          <div className="im-stepper-field">
            <Input
              label={t("postalCode")}
              name="postalCode"
              value={formData.postalCode}
              onChange={onChange}
              placeholder={t("postalCodePlaceholder")}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="im-stepper-row im-stepper-row--two">
          <div className="im-stepper-field">
            <Input
              label={t("latitude")}
              name="latitude"
              value={formData.latitude}
              onChange={onChange}
              placeholder={t("latitudePlaceholder")}
              disabled={isSubmitting}
              type="number"
              step="any"
            />
            {fieldErrors.latitude && (
              <span className="im-stepper-field-error">{fieldErrors.latitude}</span>
            )}
          </div>
          <div className="im-stepper-field">
            <Input
              label={t("longitude")}
              name="longitude"
              value={formData.longitude}
              onChange={onChange}
              placeholder={t("longitudePlaceholder")}
              disabled={isSubmitting}
              type="number"
              step="any"
            />
            {fieldErrors.longitude && (
              <span className="im-stepper-field-error">{fieldErrors.longitude}</span>
            )}
          </div>
        </div>

        <div className="im-stepper-row">
          <span className="im-stepper-field-hint">
            {t("mapTip")}
          </span>
        </div>
      </div>
    </Card>
  );
}
