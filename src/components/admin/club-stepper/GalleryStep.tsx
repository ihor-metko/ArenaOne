"use client";

import { useRef } from "react";
import { Card } from "@/components/ui";
import { UploadField } from "@/components/admin/UploadField.client";
import { StepProps } from "./types";

export function GalleryStep({
  formData,
  isSubmitting,
  onLogoChange,
  onGalleryAdd,
  onGalleryRemove,
  mode = "create",
}: StepProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">Gallery / Images</h2>
      <p className="im-stepper-section-description">
        {mode === "create"
          ? "Upload your club logo and photos."
          : "Manage your club logo and photos."}
      </p>

      <div className="im-stepper-row">
        <div className="im-stepper-field">
          <UploadField
            label="Club Logo"
            value={formData.logo}
            onChange={onLogoChange!}
            aspectRatio="square"
            helperText="Recommended: 512x512 square image"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="im-stepper-row">
        <div className="im-stepper-field im-stepper-field--full">
          <label className="im-stepper-label">Gallery Photos</label>
          <p className="im-stepper-field-hint" style={{ marginBottom: "0.5rem" }}>
            Add photos of your club facilities
          </p>

          <div className="im-stepper-gallery-grid">
            {formData.gallery.map((item, index) => (
              <div key={index} className="im-stepper-gallery-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview || item.url}
                  alt={`Gallery image ${index + 1}`}
                  className="im-stepper-gallery-image"
                />
                <button
                  type="button"
                  className="im-stepper-gallery-remove"
                  onClick={() => onGalleryRemove?.(index)}
                  disabled={isSubmitting}
                  aria-label={`Remove gallery image ${index + 1}`}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              className="im-stepper-gallery-add"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <span className="im-stepper-gallery-add-icon">+</span>
              <span>Add Image</span>
            </button>
          </div>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onGalleryAdd}
            style={{ display: "none" }}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </Card>
  );
}
