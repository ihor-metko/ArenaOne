"use client";

import { useTranslations } from "next-intl";
import { Card, Button } from "@/components/ui";
import { formatPrice } from "@/utils/price";
import type { Court } from "@/types/court";

interface CourtCardProps {
  court: Court;
  onBook?: (courtId: string) => void;
  onViewSchedule?: (courtId: string) => void;
  todaySlots?: React.ReactNode;
  showBookButton?: boolean;
  showViewSchedule?: boolean;
}

export function CourtCard({
  court,
  onBook,
  onViewSchedule,
  todaySlots,
  showBookButton = true,
  showViewSchedule = true,
}: CourtCardProps) {
  const t = useTranslations();

  return (
    <Card className="tm-court-card">
      <div className="tm-court-card-header">
        <h3 className="tm-court-name text-lg font-semibold">{court.name}</h3>
        <div className="tm-court-badges flex flex-wrap gap-1 mt-1">
          {court.type && (
            <span className="tm-badge tm-badge-type inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
              {court.type}
            </span>
          )}
          {court.surface && (
            <span className="tm-badge tm-badge-surface inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
              {court.surface}
            </span>
          )}
          {court.indoor && (
            <span className="tm-badge tm-badge-indoor inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {t("common.indoor")}
            </span>
          )}
        </div>
      </div>

      <div className="tm-court-card-body mt-3">
        <p className="tm-court-price text-sm font-medium">
          {formatPrice(court.defaultPriceCents)}{" "}
          <span className="text-gray-500">{t("common.perHour")}</span>
        </p>

        {todaySlots && (
          <div className="tm-court-slots mt-3">{todaySlots}</div>
        )}
      </div>

      <div className="tm-court-card-footer mt-4 flex gap-2">
        {showBookButton && onBook && (
          <Button
            className="tm-book-button"
            onClick={() => onBook(court.id)}
            aria-label={`${t("booking.book")} ${court.name}`}
          >
            {t("booking.book")}
          </Button>
        )}
        {showViewSchedule && onViewSchedule && (
          <Button
            variant="outline"
            className="tm-view-schedule-button"
            onClick={() => onViewSchedule(court.id)}
            aria-label={`${t("booking.viewSchedule")} ${court.name}`}
          >
            {t("booking.viewSchedule")}
          </Button>
        )}
      </div>
    </Card>
  );
}
