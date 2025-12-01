"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input, Button } from "@/components/ui";

const DEFAULT_SEARCH = "";
const DEFAULT_INDOOR_ONLY = false;

interface PublicSearchBarProps {
  initialSearch?: string;
  initialIndoorOnly?: boolean;
  onSearchChange: (search: string, indoorOnly: boolean) => void;
}

export function PublicSearchBar({
  initialSearch = DEFAULT_SEARCH,
  initialIndoorOnly = DEFAULT_INDOOR_ONLY,
  onSearchChange,
}: PublicSearchBarProps) {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [indoorOnly, setIndoorOnly] = useState(initialIndoorOnly);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(searchTerm, indoorOnly);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, indoorOnly, onSearchChange]);

  const handleClear = () => {
    setSearchTerm(DEFAULT_SEARCH);
    setIndoorOnly(DEFAULT_INDOOR_ONLY);
    onSearchChange(DEFAULT_SEARCH, DEFAULT_INDOOR_ONLY);
  };

  return (
    <div className="tm-public-search-bar mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t("clubs.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t("clubs.searchPlaceholder")}
            className="tm-search-input"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="tm-indoor-filter flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={indoorOnly}
              onChange={(e) => setIndoorOnly(e.target.checked)}
              className="tm-indoor-checkbox w-4 h-4 rounded border-gray-300 dark:border-gray-600"
              aria-label={t("clubs.indoorOnly")}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {t("clubs.indoorOnly")}
            </span>
          </label>

          {(searchTerm || indoorOnly) && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="tm-clear-filters text-sm"
            >
              {t("clubs.clearFilters")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
