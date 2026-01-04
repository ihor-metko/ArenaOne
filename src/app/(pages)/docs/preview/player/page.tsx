"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import DocsSimulationCard from "./components/DocsSimulationCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

/**
 * Player Preview Documentation Page
 * Entry point for interactive player role documentation and demo flows.
 * 
 * Features:
 * - Interactive booking flow demonstration (5 steps)
 * - Multi-step wizard with visual previews
 * - Clickable buttons to simulate actions
 * - EN/UA localization
 * - Mock data (no real bookings)
 * - Sidebar navigation with breadcrumbs
 */

// Mock data for the demo
const MOCK_CLUBS = [
  { id: "1", name: "Padel Arena Downtown", city: "Kyiv", indoor: 2, outdoor: 3 },
  { id: "2", name: "City Sports Club", city: "Kyiv", indoor: 1, outdoor: 2 },
  { id: "3", name: "Elite Padel Center", city: "Kyiv", indoor: 3, outdoor: 1 },
];

const MOCK_COURTS = [
  { id: "1", name: "Court 1", available: true },
  { id: "2", name: "Court 2", available: true },
  { id: "3", name: "Court 3", available: false },
];

export default function PlayerPreviewPage() {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Step-specific state
  const [searchQuery, setSearchQuery] = useState("");
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [selectedClub, setSelectedClub] = useState<typeof MOCK_CLUBS[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState("2024-01-15");
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [selectedCourt, setSelectedCourt] = useState<typeof MOCK_COURTS[0] | null>(null);
  const [bookingRef, setBookingRef] = useState("");

  const steps = [
    {
      title: t("docs.preview.player.step1.title"),
      description: t("docs.preview.player.step1.description"),
    },
    {
      title: t("docs.preview.player.step2.title"),
      description: t("docs.preview.player.step2.description"),
    },
    {
      title: t("docs.preview.player.step3.title"),
      description: t("docs.preview.player.step3.description"),
    },
    {
      title: t("docs.preview.player.step4.title"),
      description: t("docs.preview.player.step4.description"),
    },
    {
      title: t("docs.preview.player.step5.title"),
      description: t("docs.preview.player.step5.description"),
    },
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Auto-select demo data for smoother flow
      if (currentStep === 1 && !selectedClub) {
        setSelectedClub(MOCK_CLUBS[0]);
      }
      if (currentStep === 3 && !selectedCourt) {
        setSelectedCourt(MOCK_COURTS[0]);
      }
      if (currentStep === 4 && !bookingRef) {
        setBookingRef("DEMO-" + Math.random().toString(36).substr(2, 9).toUpperCase());
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSearchQuery("");
    setIndoorOnly(false);
    setSelectedClub(null);
    setSelectedCourt(null);
    setBookingRef("");
  };

  const handleSearch = () => {
    // Simulate search - just move to next step
    handleNextStep();
  };

  const handleSelectClub = (club: typeof MOCK_CLUBS[0]) => {
    setSelectedClub(club);
    handleNextStep();
  };

  const handleSelectCourt = (court: typeof MOCK_COURTS[0]) => {
    setSelectedCourt(court);
  };

  // Render step-specific preview
  const renderStepPreview = (stepIndex: number) => {
    if (stepIndex !== currentStep) return null;

    switch (stepIndex) {
      case 0: // Search for a club
        return (
          <div className="im-docs-step-preview">
            <div className="mb-4">
              <Input
                placeholder={t("docs.preview.player.step1.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-3"
              />
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  checked={indoorOnly}
                  onChange={(e) => setIndoorOnly(e.target.checked)}
                  id="indoor-filter"
                />
                <label htmlFor="indoor-filter" style={{ color: "var(--im-text-secondary)" }}>
                  {t("docs.preview.player.step1.filterLabel")}
                </label>
              </div>
              <Button variant="primary" onClick={handleSearch} className="w-full">
                {t("docs.preview.player.step1.searchButton")}
              </Button>
            </div>
          </div>
        );

      case 1: // Club list
        return (
          <div className="im-docs-step-preview">
            <p className="mb-4 text-sm" style={{ color: "var(--im-text-secondary)" }}>
              {t("docs.preview.player.step2.clubsFound", { count: MOCK_CLUBS.length })}
            </p>
            <div className="space-y-3">
              {MOCK_CLUBS.map((club) => (
                <div
                  key={club.id}
                  className="p-4 rounded border"
                  style={{
                    backgroundColor: "var(--im-bg-secondary)",
                    borderColor: "var(--im-border)",
                  }}
                >
                  <h4 className="font-semibold mb-2" style={{ color: "var(--im-text-primary)" }}>
                    {club.name}
                  </h4>
                  <p className="text-sm mb-2" style={{ color: "var(--im-text-secondary)" }}>
                    📍 {club.city}
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--im-muted)" }}>
                    {t("docs.preview.player.step2.indoorCourts", { count: club.indoor })} • {" "}
                    {t("docs.preview.player.step2.outdoorCourts", { count: club.outdoor })}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleSelectClub(club)}
                    className="w-full"
                  >
                    {t("docs.preview.player.step2.viewClubButton")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 2: // Club page & Quick Booking
        return (
          <div className="im-docs-step-preview">
            {selectedClub && (
              <>
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2" style={{ color: "var(--im-text-primary)" }}>
                    {selectedClub.name}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--im-text-secondary)" }}>
                    {t("docs.preview.player.step3.clubDescription")}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p style={{ color: "var(--im-muted)" }}>{t("docs.preview.player.step3.location")}</p>
                      <p style={{ color: "var(--im-text-secondary)" }}>📍 {selectedClub.city}</p>
                    </div>
                    <div>
                      <p style={{ color: "var(--im-muted)" }}>{t("docs.preview.player.step3.hours")}</p>
                      <p style={{ color: "var(--im-text-secondary)" }}>⏰ 8:00 - 22:00</p>
                    </div>
                  </div>
                </div>
                <Button variant="primary" onClick={handleNextStep} className="w-full im-highlight-button">
                  ⚡ {t("docs.preview.player.step3.quickBookButton")}
                </Button>
              </>
            )}
          </div>
        );

      case 3: // Select court and time
        return (
          <div className="im-docs-step-preview">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--im-text-secondary)" }}>
                  {t("docs.preview.player.step4.selectDate")}
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--im-text-secondary)" }}>
                  {t("docs.preview.player.step4.selectTime")}
                </label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: "var(--im-text-secondary)" }}>
                {t("docs.preview.player.step4.duration")}
              </label>
              <select
                className="w-full p-2 rounded border"
                style={{
                  backgroundColor: "var(--im-bg-secondary)",
                  borderColor: "var(--im-border)",
                  color: "var(--im-text-primary)",
                }}
              >
                <option>60 {t("common.minutes")}</option>
                <option>90 {t("common.minutes")}</option>
                <option>120 {t("common.minutes")}</option>
              </select>
            </div>
            <div>
              <p className="text-sm mb-3 font-semibold" style={{ color: "var(--im-text-primary)" }}>
                {t("docs.preview.player.step4.availableCourts")}
              </p>
              <div className="space-y-2">
                {MOCK_COURTS.map((court) => (
                  <button
                    key={court.id}
                    onClick={() => court.available && handleSelectCourt(court)}
                    disabled={!court.available}
                    className="w-full p-3 rounded border text-left transition-all"
                    style={{
                      backgroundColor:
                        selectedCourt?.id === court.id
                          ? "var(--color-primary-bg)"
                          : "var(--im-bg-secondary)",
                      borderColor:
                        selectedCourt?.id === court.id ? "var(--im-primary)" : "var(--im-border)",
                      color: court.available ? "var(--im-text-primary)" : "var(--im-muted)",
                      opacity: court.available ? 1 : 0.5,
                      cursor: court.available ? "pointer" : "not-allowed",
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{court.name}</span>
                      <span className="text-xs">
                        {court.available ? "✓ " + t("common.available") : "⊗ " + t("common.booked")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Confirmation
        return (
          <div className="im-docs-step-preview">
            {bookingRef && (
              <div className="text-center">
                <div
                  className="mb-4 p-4 rounded"
                  style={{ backgroundColor: "var(--color-success-bg)" }}
                >
                  <p className="text-lg font-bold" style={{ color: "var(--color-success)" }}>
                    ✓ {t("docs.preview.player.step5.bookingSuccess")}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--color-success)" }}>
                    {t("docs.preview.player.step5.bookingReference", { ref: bookingRef })}
                  </p>
                </div>
                <div
                  className="p-4 rounded border text-left"
                  style={{
                    backgroundColor: "var(--im-bg-secondary)",
                    borderColor: "var(--im-border)",
                  }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: "var(--im-text-primary)" }}>
                    {t("docs.preview.player.step5.bookingSummary")}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--im-muted)" }}>
                        {t("docs.preview.player.step5.club")}:
                      </span>
                      <span style={{ color: "var(--im-text-secondary)" }}>
                        {selectedClub?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--im-muted)" }}>
                        {t("docs.preview.player.step5.court")}:
                      </span>
                      <span style={{ color: "var(--im-text-secondary)" }}>
                        {selectedCourt?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--im-muted)" }}>
                        {t("docs.preview.player.step5.dateTime")}:
                      </span>
                      <span style={{ color: "var(--im-text-secondary)" }}>
                        {selectedDate} {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t" style={{ borderColor: "var(--im-border)" }}>
                      <span className="font-semibold" style={{ color: "var(--im-text-primary)" }}>
                        {t("docs.preview.player.step5.totalPrice")}:
                      </span>
                      <span className="font-bold" style={{ color: "var(--im-primary)" }}>
                        {t("docs.preview.player.mockData.price")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="im-page-container">
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--im-muted)" }}>
        <span>{t("docs.preview.common.demoMode")}</span>
        <span>›</span>
        <span style={{ color: "var(--im-primary)" }}>
          {t(`docs.preview.player.breadcrumb.step${currentStep + 1}`)}
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--im-text-primary)" }}>
        {t("docs.preview.player.title")}
      </h1>
      <p className="text-lg mb-8" style={{ color: "var(--im-text-secondary)" }}>
        {t("docs.preview.player.subtitle")}
      </p>

      {/* Sidebar Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div
          className="lg:col-span-1 p-4 rounded border"
          style={{ backgroundColor: "var(--im-bg-secondary)", borderColor: "var(--im-border)" }}
        >
          <h3 className="font-semibold mb-3" style={{ color: "var(--im-text-primary)" }}>
            {t("docs.preview.player.stepTitle")}
          </h3>
          <nav className="space-y-2">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className="w-full text-left p-2 rounded transition-colors"
                style={{
                  backgroundColor:
                    index === currentStep ? "var(--color-primary-bg)" : "transparent",
                  color:
                    index === currentStep
                      ? "var(--im-primary)"
                      : index < currentStep
                      ? "var(--im-text-secondary)"
                      : "var(--im-muted)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor:
                        index < currentStep
                          ? "var(--color-success)"
                          : index === currentStep
                          ? "var(--im-primary)"
                          : "var(--im-muted)",
                      color: "white",
                    }}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </span>
                  <span className="text-sm">{t(`docs.preview.player.breadcrumb.step${index + 1}`)}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <DocsSimulationCard
            badge={t("docs.preview.common.demoMode")}
            title={steps[currentStep].title}
            description={steps[currentStep].description}
            note={t("docs.preview.common.simulationNote")}
            preview={renderStepPreview(currentStep)}
            actions={
              <>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handlePrevStep}>
                    ← {t("docs.preview.player.previousStep")}
                  </Button>
                )}
                {currentStep < steps.length - 1 && (
                  <Button variant="primary" onClick={handleNextStep}>
                    {t("docs.preview.player.nextStep")} →
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button variant="primary" onClick={handleReset}>
                    {t("docs.preview.common.resetDemo")}
                  </Button>
                )}
              </>
            }
          />
        </div>
      </div>

      {/* Info Section */}
      <div
        className="mt-8 p-6 rounded"
        style={{ backgroundColor: "var(--im-bg-secondary)", border: "1px solid var(--im-border)" }}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--im-text-primary)" }}>
          {t("docs.preview.player.stepTitle")}
        </h2>
        <p className="mb-3" style={{ color: "var(--im-text-secondary)" }}>
          {t("docs.preview.player.stepDescription")}
        </p>
        <ul className="list-disc list-inside space-y-2" style={{ color: "var(--im-text-secondary)" }}>
          <li>Interactive step-by-step booking process</li>
          <li>Real-time visual feedback for each action</li>
          <li>Full EN/UA localization support</li>
          <li>Dark theme with semantic im-docs-* classes</li>
          <li>{t("docs.preview.common.simulationNote")}</li>
        </ul>
      </div>
    </div>
  );
}
