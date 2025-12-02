"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { GeneralInfoStep } from "./GeneralInfoStep";
import { ContactsStep } from "./ContactsStep";
import { HoursStep } from "./HoursStep";
import { CourtsStep } from "./CourtsStep";
import { GalleryStep } from "./GalleryStep";
import {
  StepperFormData,
  BusinessHour,
  UploadedFile,
  InlineCourt,
  STEPS,
  initialBusinessHours,
  generateTempId,
} from "./types";
import type { ClubDetail } from "@/types/club";
import "../ClubCreationStepper.css";
import "../InlineCourtsField.css";

interface ClubEditStepperProps {
  club: ClubDetail;
  onSaveStep: (step: number, data: Partial<StepperFormData>) => Promise<void>;
}

function clubToFormData(club: ClubDetail): StepperFormData {
  // Convert club business hours to form format
  const businessHours: BusinessHour[] = initialBusinessHours.map((defaultHour) => {
    const existingHour = club.businessHours.find((h) => h.dayOfWeek === defaultHour.dayOfWeek);
    if (existingHour) {
      return {
        dayOfWeek: existingHour.dayOfWeek,
        openTime: existingHour.openTime,
        closeTime: existingHour.closeTime,
        isClosed: existingHour.isClosed,
      };
    }
    return defaultHour;
  });

  // Convert courts to inline format
  const courts: InlineCourt[] = club.courts.map((court) => ({
    id: court.id,
    name: court.name,
    type: court.type || "",
    surface: court.surface || "",
    indoor: court.indoor,
    defaultPriceCents: court.defaultPriceCents,
  }));

  // Convert gallery to upload format
  const gallery: UploadedFile[] = club.gallery.map((img) => ({
    url: img.imageUrl,
    key: img.imageKey || "",
  }));

  return {
    name: club.name,
    slug: club.slug || "",
    clubType: club.tags ? JSON.parse(club.tags)[0] || "" : "",
    shortDescription: club.shortDescription || "",
    isPublic: club.isPublic,
    address: club.location,
    city: club.city || "",
    postalCode: "",
    phone: club.phone || "",
    email: club.email || "",
    website: club.website || "",
    businessHours,
    courts,
    logo: club.logo ? { url: club.logo, key: "" } : null,
    gallery,
  };
}

export function ClubEditStepper({ club, onSaveStep }: ClubEditStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<StepperFormData>(() => clubToFormData(club));
  const [originalData, setOriginalData] = useState<StepperFormData>(() => clubToFormData(club));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Update form data when club changes
  useEffect(() => {
    const newFormData = clubToFormData(club);
    setFormData(newFormData);
    setOriginalData(newFormData);
    setHasChanges(false);
  }, [club]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const actualValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: actualValue }));
    setHasChanges(true);

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [fieldErrors]);

  const handleBusinessHoursChange = useCallback((hours: BusinessHour[]) => {
    setFormData((prev) => ({ ...prev, businessHours: hours }));
    setHasChanges(true);
  }, []);

  const handleLogoChange = useCallback((file: UploadedFile | null) => {
    setFormData((prev) => ({ ...prev, logo: file }));
    setHasChanges(true);
    if (fieldErrors.logo) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.logo;
        return newErrors;
      });
    }
  }, [fieldErrors]);

  const handleGalleryAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems: UploadedFile[] = files.map((file) => ({
      url: "",
      key: "",
      file,
      preview: URL.createObjectURL(file),
    }));
    setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, ...newItems] }));
    setHasChanges(true);
  }, []);

  const handleGalleryRemove = useCallback((index: number) => {
    setFormData((prev) => {
      const item = prev.gallery[index];
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return { ...prev, gallery: prev.gallery.filter((_, i) => i !== index) };
    });
    setHasChanges(true);
  }, []);

  // Court handlers
  const handleAddCourt = useCallback(() => {
    const newCourt: InlineCourt = {
      id: generateTempId(),
      name: "",
      type: "",
      surface: "",
      indoor: false,
      defaultPriceCents: 0,
    };
    setFormData((prev) => ({ ...prev, courts: [...prev.courts, newCourt] }));
    setHasChanges(true);
  }, []);

  const handleRemoveCourt = useCallback((id: string) => {
    setFormData((prev) => ({ ...prev, courts: prev.courts.filter((c) => c.id !== id) }));
    setHasChanges(true);
  }, []);

  const handleCourtChange = useCallback((id: string, field: keyof InlineCourt, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      courts: prev.courts.map((court) =>
        court.id === id ? { ...court, [field]: value } : court
      ),
    }));
    setHasChanges(true);
  }, []);

  // Validation per step
  const validateStep = useCallback((step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        errors.name = "Club name is required";
      }
    }

    if (step === 2) {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Invalid email format";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSaveStep = useCallback(async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      await onSaveStep(currentStep, formData);
      setOriginalData({ ...formData });
      setHasChanges(false);
      showToast("success", "Changes saved successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save changes";
      showToast("error", message);
      
      // Handle specific errors
      if (message.includes("slug")) {
        setFieldErrors({ slug: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, formData, onSaveStep, showToast, validateStep]);

  const handleCancelStep = useCallback(() => {
    setFormData({ ...originalData });
    setFieldErrors({});
    setHasChanges(false);
  }, [originalData]);

  const handleStepClick = useCallback((stepId: number) => {
    if (hasChanges) {
      // Allow navigation but warn about unsaved changes
      const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to switch steps?");
      if (!confirmLeave) {
        return;
      }
      setFormData({ ...originalData });
      setHasChanges(false);
    }
    setCurrentStep(stepId);
    setFieldErrors({});
  }, [hasChanges, originalData]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length) {
      if (hasChanges) {
        const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to continue?");
        if (!confirmLeave) {
          return;
        }
        setFormData({ ...originalData });
        setHasChanges(false);
      }
      setCurrentStep((prev) => prev + 1);
      setFieldErrors({});
    }
  }, [currentStep, hasChanges, originalData]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      if (hasChanges) {
        const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to go back?");
        if (!confirmLeave) {
          return;
        }
        setFormData({ ...originalData });
        setHasChanges(false);
      }
      setCurrentStep((prev) => prev - 1);
      setFieldErrors({});
    }
  }, [currentStep, hasChanges, originalData]);

  // Render step content
  const renderStepContent = () => {
    const stepProps = {
      formData,
      fieldErrors,
      isSubmitting,
      onInputChange: handleInputChange,
      onBusinessHoursChange: handleBusinessHoursChange,
      onLogoChange: handleLogoChange,
      onGalleryAdd: handleGalleryAdd,
      onGalleryRemove: handleGalleryRemove,
      onAddCourt: handleAddCourt,
      onRemoveCourt: handleRemoveCourt,
      onCourtChange: handleCourtChange,
      mode: "edit" as const,
    };

    switch (currentStep) {
      case 1:
        return <GeneralInfoStep {...stepProps} />;
      case 2:
        return <ContactsStep {...stepProps} />;
      case 3:
        return <HoursStep {...stepProps} />;
      case 4:
        return <CourtsStep {...stepProps} />;
      case 5:
        return <GalleryStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="im-stepper im-stepper--edit">
      {/* Header */}
      <div className="im-stepper-header">
        <div className="im-stepper-breadcrumb">
          <Link href="/admin/clubs" className="im-stepper-breadcrumb-link">
            Clubs
          </Link>
          <span className="im-stepper-breadcrumb-separator">/</span>
          <span className="im-stepper-breadcrumb-current">{club.name}</span>
        </div>
      </div>

      {/* Step Indicator */}
      <nav className="im-stepper-indicator" aria-label="Edit steps">
        {STEPS.map((step, index) => (
          <div key={step.id} className="im-stepper-indicator-step-wrapper" style={{ display: "flex", alignItems: "center" }}>
            <button
              type="button"
              className={`im-stepper-indicator-step im-stepper-indicator-step--clickable ${
                currentStep === step.id ? "im-stepper-indicator-step--active" : ""
              }`}
              onClick={() => handleStepClick(step.id)}
              aria-current={currentStep === step.id ? "step" : undefined}
              aria-label={`Go to ${step.label} step`}
            >
              <span className="im-stepper-indicator-number">{step.id}</span>
              <span className="im-stepper-indicator-label">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className="im-stepper-indicator-line" />
            )}
          </div>
        ))}
      </nav>

      {/* Progress Text */}
      <p className="im-stepper-progress">
        Step {currentStep} of {STEPS.length}
        {hasChanges && <span className="im-stepper-unsaved"> (unsaved changes)</span>}
      </p>

      {/* Step Content */}
      <div className="im-stepper-content">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="im-stepper-navigation">
        <div className="im-stepper-navigation-left">
          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelStep}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
        <div className="im-stepper-navigation-right">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          {hasChanges && (
            <Button
              type="button"
              onClick={handleSaveStep}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Step"}
            </Button>
          )}
          {currentStep < STEPS.length && (
            <Button
              type="button"
              variant="outline"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`im-stepper-toast im-stepper-toast--${toast.type}`} role="alert">
          {toast.message}
        </div>
      )}
    </div>
  );
}
