"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card, IMLink } from "@/components/ui";

/**
 * Client Component for the Quick Links section
 * Needs to be client-side to access session for role-based links
 */
export function QuickLinksSection() {
  const { data: session, status } = useSession();
  const t = useTranslations();

  const isAuthenticated = status === "authenticated" && session?.user;

  return (
    <section className="tm-quick-links py-12 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <Card title={t("home.quickLinks")}>
          <div className="rsp-links flex flex-col gap-2">
            {/* Public link - always visible */}
            <IMLink href="/clubs">
              {t("home.viewClubs")}
            </IMLink>

            {/* Player links */}
            {session?.user?.role === "player" && (
              <>
                <IMLink href="/dashboard">
                  {t("home.dashboard")}
                </IMLink>
                <IMLink href="/trainings">
                  {t("training.history.title")}
                </IMLink>
              </>
            )}

            {/* Coach links */}
            {session?.user?.role === "coach" && (
              <IMLink href="/coach/dashboard">
                {t("home.dashboard")}
              </IMLink>
            )}

            {/* Admin links */}
            {session?.user?.role === "admin" && (
              <>
                <IMLink href="/admin/clubs">
                  {t("home.manageClubs")}
                </IMLink>
                <IMLink href="/admin/coaches">
                  {t("home.manageCoaches")}
                </IMLink>
                <IMLink href="/admin/notifications">
                  {t("home.manageNotifications")}
                </IMLink>
              </>
            )}

            {/* Auth links for unauthenticated users */}
            {!isAuthenticated && (
              <>
                <IMLink href="/auth/sign-in">
                  {t("common.signIn")}
                </IMLink>
                <IMLink href="/auth/sign-up">
                  {t("common.register")}
                </IMLink>
              </>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
