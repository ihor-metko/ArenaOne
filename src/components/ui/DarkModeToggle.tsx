"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import "./DarkModeToggle.css";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);
  const t = useTranslations("darkMode");

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Prevent hydration mismatch by not rendering until client-side state is determined
  if (isDark === null) {
    return (
      <button className="rsp-dark-toggle" aria-label={t("toggleDarkMode")}>
        <span className="rsp-dark-toggle-icon" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="rsp-dark-toggle"
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
    >
      {isDark ? (
        <svg
          className="rsp-dark-toggle-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="rsp-dark-toggle-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
