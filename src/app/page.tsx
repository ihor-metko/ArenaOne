"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button, Card, DarkModeToggle, LanguageSwitcher } from "@/components/ui";
import { UserRoleIndicator } from "@/components/UserRoleIndicator";
import { useCurrentLocale } from "@/hooks/useCurrentLocale";

export default function Home() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const currentLocale = useCurrentLocale();

  const isAuthenticated = status === "authenticated" && session?.user;

  return (
    <main className="rsp-container min-h-screen p-8">
      <header className="rsp-header flex items-center justify-between mb-8">
        <h1 className="rsp-title text-3xl font-bold">{t("home.title")}</h1>
        <div className="flex items-center gap-4">
          <UserRoleIndicator />
          <LanguageSwitcher currentLocale={currentLocale} />
          <DarkModeToggle />
        </div>
      </header>

      <section className="rsp-content max-w-2xl mx-auto">
        {/* Hero section for public users */}
        <Card title={t("home.welcomeTitle")}>
          <p className="rsp-text mb-4">
            {t("home.welcomeMessage")}
          </p>
          <div className="rsp-button-group flex gap-2">
            <Link href="/clubs">
              <Button>{t("home.viewClubs")}</Button>
            </Link>
            {!isAuthenticated && (
              <Link href="/auth/sign-in">
                <Button variant="outline">{t("common.signIn")}</Button>
              </Link>
            )}
          </div>
        </Card>

        <Card title={t("home.quickLinks")} className="mt-6">
          <div className="rsp-links flex flex-col gap-2">
            {/* Public link - always visible */}
            <Link href="/clubs" className="rsp-link text-blue-500 hover:underline">
              {t("home.viewClubs")}
            </Link>

            {/* Player links */}
            {session?.user?.role === "player" && (
              <Link href="/trainings" className="rsp-link text-blue-500 hover:underline">
                {t("training.history.title")}
              </Link>
            )}

            {/* Coach links */}
            {session?.user?.role === "coach" && (
              <Link href="/coach/dashboard" className="rsp-link text-blue-500 hover:underline">
                {t("home.dashboard")}
              </Link>
            )}

            {/* Admin links */}
            {session?.user?.role === "admin" && (
              <>
                <Link href="/admin/clubs" className="rsp-link text-blue-500 hover:underline">
                  {t("home.manageClubs")}
                </Link>

                <Link href="/admin/coaches" className="rsp-link text-blue-500 hover:underline">
                  {t("home.manageCoaches")}
                </Link>

                <Link href="/admin/notifications" className="rsp-link text-blue-500 hover:underline">
                  {t("home.manageNotifications")}
                </Link>
              </>
            )}

            {/* Auth links for unauthenticated users */}
            {!isAuthenticated && (
              <>
                <Link href="/auth/sign-in" className="rsp-link text-blue-500 hover:underline">
                  {t("common.signIn")}
                </Link>
                <Link href="/auth/sign-up" className="rsp-link text-blue-500 hover:underline">
                  {t("common.register")}
                </Link>
              </>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
