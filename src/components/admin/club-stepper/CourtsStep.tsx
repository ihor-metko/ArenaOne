"use client";

import { Card, Button, Input } from "@/components/ui";
import { StepProps } from "./types";

export function CourtsStep({
  formData,
  isSubmitting,
  onAddCourt,
  onRemoveCourt,
  onCourtChange,
  mode = "create",
}: StepProps) {
  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">Courts</h2>
      <p className="im-stepper-section-description">
        {mode === "create"
          ? "Add courts for your club. You can add more later from the club detail page."
          : "Manage courts for your club."}
      </p>

      {formData.courts.length > 0 && (
        <div className="im-inline-courts-list">
          {formData.courts.map((court, index) => (
            <div key={court.id} className="im-inline-courts-item">
              <div className="im-inline-courts-header">
                <span className="im-inline-courts-number">Court {index + 1}</span>
                <button
                  type="button"
                  className="im-inline-courts-remove"
                  onClick={() => onRemoveCourt?.(court.id)}
                  disabled={isSubmitting}
                  aria-label={`Remove court ${index + 1}`}
                >
                  ✕
                </button>
              </div>

              <div className="im-inline-courts-fields">
                <div className="im-inline-courts-field">
                  <Input
                    label="Name"
                    value={court.name}
                    onChange={(e) => onCourtChange?.(court.id, "name", e.target.value)}
                    placeholder="Court name"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="im-inline-courts-field">
                  <Input
                    label="Type"
                    value={court.type}
                    onChange={(e) => onCourtChange?.(court.id, "type", e.target.value)}
                    placeholder="e.g., padel, tennis"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="im-inline-courts-field">
                  <Input
                    label="Surface"
                    value={court.surface}
                    onChange={(e) => onCourtChange?.(court.id, "surface", e.target.value)}
                    placeholder="e.g., artificial, clay"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="im-inline-courts-field">
                  <Input
                    label="Default Price (cents)"
                    type="number"
                    min="0"
                    value={court.defaultPriceCents.toString()}
                    onChange={(e) => onCourtChange?.(court.id, "defaultPriceCents", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="im-inline-courts-field im-inline-courts-checkbox-field">
                  <label className="im-inline-courts-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={court.indoor}
                      onChange={(e) => onCourtChange?.(court.id, "indoor", e.target.checked)}
                      disabled={isSubmitting}
                      className="im-inline-courts-checkbox"
                    />
                    <span className="im-inline-courts-checkbox-label">Indoor</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={onAddCourt}
        disabled={isSubmitting}
        className="im-inline-courts-add"
      >
        + Add Court
      </Button>
    </Card>
  );
}
