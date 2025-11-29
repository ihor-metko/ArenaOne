"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { Club } from "@/types/club";
import "@/components/ClubsList.css";

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export default function ClubsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clubs");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/sign-in");
          return;
        }
        if (response.status === 403) {
          setError("Access denied. Only players can view the clubs list.");
          return;
        }
        throw new Error("Failed to fetch clubs");
      }
      const data = await response.json();
      setClubs(data);
      setError("");
    } catch {
      setError("Failed to load clubs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth/sign-in");
      return;
    }

    if (session.user.role !== "player") {
      setError("Access denied. Only players can view the clubs list.");
      setLoading(false);
      return;
    }

    fetchClubs();
  }, [session, status, router, fetchClubs]);

  if (status === "loading" || loading) {
    return (
      <main className="tm-clubs-page">
        <div className="tm-clubs-loading">
          <div className="tm-clubs-loading-spinner" />
          <span className="tm-clubs-loading-text">Loading clubs...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="tm-clubs-page">
        <div className="tm-access-denied">
          <h1 className="tm-access-denied-title">Access Denied</h1>
          <p className="tm-access-denied-text">{error}</p>
          <Link href="/" className="tm-clubs-link">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="tm-clubs-page">
      <header className="tm-clubs-header">
        <h1 className="tm-clubs-title">Clubs</h1>
        <p className="tm-clubs-subtitle">Browse available paddle clubs</p>
      </header>

      {clubs.length === 0 ? (
        <div className="tm-clubs-empty">
          <p className="tm-clubs-empty-text">No clubs available yet.</p>
        </div>
      ) : (
        <section className="tm-clubs-grid">
          {clubs.map((club) => (
            <div key={club.id} className="tm-club-card">
              <div className="tm-club-card-header">
                {isValidImageUrl(club.logo) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={club.logo as string}
                    alt={`${club.name} logo`}
                    className="tm-club-logo"
                  />
                ) : (
                  <div className="tm-club-logo-placeholder">
                    {club.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="tm-club-name">{club.name}</h2>
              </div>

              <div className="tm-club-details">
                <div className="tm-club-detail-row">
                  <span className="tm-club-detail-label">Address:</span>
                  <span className="tm-club-detail-value">{club.location}</span>
                </div>
                {club.contactInfo && (
                  <div className="tm-club-detail-row">
                    <span className="tm-club-detail-label">Contact:</span>
                    <span className="tm-club-detail-value">
                      {club.contactInfo}
                    </span>
                  </div>
                )}
                {club.openingHours && (
                  <div className="tm-club-detail-row">
                    <span className="tm-club-detail-label">Hours:</span>
                    <span className="tm-club-detail-value">
                      {club.openingHours}
                    </span>
                  </div>
                )}
              </div>

              <Link href={`/clubs/${club.id}`}>
                <Button className="tm-view-courts-button">View Courts</Button>
              </Link>
            </div>
          ))}
        </section>
      )}

      <div className="tm-clubs-navigation">
        <Link href="/" className="tm-clubs-link">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
