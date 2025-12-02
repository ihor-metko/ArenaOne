"use client";

import { Card, Input } from "@/components/ui";
import { StepProps } from "./types";

export function ContactsStep({
  formData,
  fieldErrors,
  isSubmitting,
  onInputChange,
  mode = "create",
}: StepProps) {
  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">Contacts and Address</h2>
      <p className="im-stepper-section-description">
        {mode === "create"
          ? "Provide contact information and location details."
          : "Edit contact information and location details."}
      </p>

      <div className="im-stepper-row">
        <div className="im-stepper-field im-stepper-field--full">
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={onInputChange}
            placeholder="Street address"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="im-stepper-row im-stepper-row--two">
        <div className="im-stepper-field">
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={onInputChange}
            placeholder="City"
            disabled={isSubmitting}
          />
        </div>
        <div className="im-stepper-field">
          <Input
            label="Postal Code"
            name="postalCode"
            value={formData.postalCode}
            onChange={onInputChange}
            placeholder="Postal code"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="im-stepper-row im-stepper-row--two">
        <div className="im-stepper-field">
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={onInputChange}
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting}
          />
        </div>
        <div className="im-stepper-field">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onInputChange}
            placeholder="contact@club.com"
            disabled={isSubmitting}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {fieldErrors.email && (
            <span id="email-error" className="im-stepper-field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>
      </div>

      <div className="im-stepper-row">
        <div className="im-stepper-field im-stepper-field--full">
          <Input
            label="Website"
            name="website"
            value={formData.website}
            onChange={onInputChange}
            placeholder="https://www.club.com"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </Card>
  );
}
