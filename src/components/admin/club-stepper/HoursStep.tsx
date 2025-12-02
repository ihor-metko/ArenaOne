"use client";

import { Card } from "@/components/ui";
import { BusinessHoursField } from "@/components/admin/BusinessHoursField.client";
import { StepProps } from "./types";

export function HoursStep({
  formData,
  isSubmitting,
  onBusinessHoursChange,
  mode = "create",
}: StepProps) {
  return (
    <Card className="im-stepper-section">
      <h2 className="im-stepper-section-title">Club Working Hours</h2>
      <p className="im-stepper-section-description">
        {mode === "create"
          ? "Set the standard operating hours for each day of the week."
          : "Edit the standard operating hours for each day of the week."}
      </p>
      <BusinessHoursField
        value={formData.businessHours}
        onChange={onBusinessHoursChange!}
        disabled={isSubmitting}
      />
    </Card>
  );
}
