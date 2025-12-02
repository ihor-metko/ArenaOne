import { getTranslations } from "next-intl/server";
import { getPopularClubs } from "@/lib/homeData";
import { PublicClubCard } from "@/components/PublicClubCard";
import { IMLink } from "@/components/ui";

/**
 * Server Component for rendering the popular clubs section
 * Fetches data server-side and renders the clubs grid
 */
export async function PopularClubsSection() {
  const t = await getTranslations();
  const popularClubs = await getPopularClubs(4);

  return (
    <section className="rsp-popular-clubs-section">
      <div className="rsp-popular-clubs-container">
        <h2 className="rsp-popular-clubs-title">{t("home.popularClubs")}</h2>

        {popularClubs.length > 0 ? (
          <div className="rsp-popular-clubs-grid">
            {popularClubs.map((club) => (
              <PublicClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>{t("clubs.noClubs")}</p>
            <IMLink href="/clubs" className="mt-2 inline-block">
              {t("home.viewClubs")}
            </IMLink>
          </div>
        )}
      </div>
    </section>
  );
}
