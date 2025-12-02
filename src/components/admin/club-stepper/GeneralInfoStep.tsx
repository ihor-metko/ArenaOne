"use client";

import { Card, Input } from "@/components/ui";
import { StepProps, CLUB_TYPES } from "./types";

export function GeneralInfoStep({
  formData,
  fieldErrors,
  isSubmitting,
  onInputChange,
  mode = "create",
}: StepProps) {
  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">General Information</h2>
      <p className="im-stepper-section-description">
        {mode === "create" 
          ? "Enter the basic details about your club."
          : "Edit the basic details about your club."}
      </p>

      <div className="im-stepper-row">
        <div className="im-stepper-field im-stepper-field--full">
          <Input
            label="Club Name *"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            placeholder="Enter club name"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {fieldErrors.name && (
            <span id="name-error" className="im-stepper-field-error" role="alert">
              {fieldErrors.name}
            </span>
          )}
        </div>
      </div>

      <div className="im-stepper-row im-stepper-row--two">
        <div className="im-stepper-field">
          <Input
            label="Slug (optional)"
            name="slug"
            value={formData.slug}
            onChange={onInputChange}
            placeholder="club-name-slug"
            disabled={isSubmitting}
            aria-describedby="slug-hint"
          />
          <span id="slug-hint" className="im-stepper-field-hint">
            Auto-generated from name if empty
          </span>
          {fieldErrors.slug && (
            <span className="im-stepper-field-error" role="alert">
              {fieldErrors.slug}
            </span>
          )}
        </div>
        <div className="im-stepper-field">
          <label htmlFor="clubType" className="im-stepper-label">Club Type</label>
          <select
            id="clubType"
            name="clubType"
            value={formData.clubType}
            onChange={onInputChange}
            className="im-stepper-select"
            disabled={isSubmitting}
          >
            <option value="">Select type...</option>
            {CLUB_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="im-stepper-row">
        <div className="im-stepper-field im-stepper-field--full">
          <label htmlFor="shortDescription" className="im-stepper-label">Short Description</label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={onInputChange}
            placeholder="Brief description of the club..."
            className="im-stepper-textarea"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {mode === "edit" && (
        <div className="im-stepper-row">
          <div className="im-stepper-field">
            <label className="im-stepper-checkbox-wrapper">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic ?? false}
                onChange={(e) => {
                  const syntheticEvent = {
                    target: {
                      name: "isPublic",
                      value: e.target.checked,
                      type: "checkbox",
                    },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  onInputChange(syntheticEvent);
                }}
                disabled={isSubmitting}
                className="im-stepper-checkbox"
              />
              <span className="im-stepper-checkbox-label">
                Publish club (visible to public)
              </span>
            </label>
          </div>
        </div>
      )}
    </Card>
  );
}
