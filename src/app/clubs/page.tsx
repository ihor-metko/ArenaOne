"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { PublicClubCard } from "@/components/PublicClubCard";
import { PublicSearchBar } from "@/components/PublicSearchBar";
import "@/components/ClubsList.css";

interface ClubWithCounts {
  id: string;
  name: string;
  location: string;
  contactInfo?: string | null;
  openingHours?: string | null;
  logo?: string | null;
  createdAt: string;
  indoorCount: number;
  outdoorCount: number;
}

export default function ClubsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const [clubs, setClubs] = useState<ClubWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [indoorOnly, setIndoorOnly] = useState(false);

  const fetchClubs = useCallback(async (search: string, indoor: boolean) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (indoor) params.set("indoor", "true");
      
      const url = `/api/clubs${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch clubs");
      }
      const data = await response.json();
      setClubs(data);
      setError("");
    } catch {
      setError(t("clubs.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchClubs(searchTerm, indoorOnly);
  }, [fetchClubs, searchTerm, indoorOnly]);

  const handleSearchChange = useCallback((search: string, indoor: boolean) => {
    setSearchTerm(search);
    setIndoorOnly(indoor);
  }, []);

  // Determine if user is authenticated
  const isAuthenticated = status === "authenticated" && session?.user;

  if (loading && clubs.length === 0) {
    return (
      <main className="tm-clubs-page">
        <div className="tm-clubs-loading">
          <div className="tm-clubs-loading-spinner" />
          <span className="tm-clubs-loading-text">{t("clubs.loadingClubs")}</span>
        </div>
      </main>
    );
  }

  if (error && clubs.length === 0) {
    return (
      <main className="tm-clubs-page">
        <div className="tm-access-denied">
          <h1 className="tm-access-denied-title">{t("common.error")}</h1>
          <p className="tm-access-denied-text">{error}</p>
          <Link href="/" className="tm-clubs-link">
            {t("common.backToHome")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="tm-clubs-page">
      <header className="tm-clubs-header">
        <h1 className="tm-clubs-title">{t("clubs.title")}</h1>
        <p className="tm-clubs-subtitle">{t("clubs.subtitle")}</p>
      </header>

      {/* Sign in prompt for unauthenticated users */}
      {!isAuthenticated && (
        <div className="tm-auth-cta mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <Link href="/auth/sign-in" className="font-semibold underline hover:no-underline">
              {t("auth.signInToBook")}
            </Link>
          </p>
        </div>
      )}

      {/* Search bar */}
      <PublicSearchBar
        initialSearch={searchTerm}
        initialIndoorOnly={indoorOnly}
        onSearchChange={handleSearchChange}
      />

      {loading ? (
        <div className="tm-clubs-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="tm-club-card animate-pulse">
              <div className="tm-club-card-header">
                <div className="tm-club-logo-placeholder bg-gray-200 dark:bg-gray-700" />
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="tm-club-details space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="tm-clubs-empty">
          <p className="tm-clubs-empty-text">
            {searchTerm || indoorOnly 
              ? t("clubs.noClubsFound")
              : t("clubs.noClubs")
            }
          </p>
        </div>
      ) : (
        <section className="tm-clubs-grid">
          {clubs.map((club) => (
            <PublicClubCard key={club.id} club={club} />
          ))}
        </section>
      )}

      <div className="tm-clubs-navigation">
        <Link href="/" className="tm-clubs-link">
          {t("common.backToHome")}
        </Link>
      </div>
    </main>
  );
}
