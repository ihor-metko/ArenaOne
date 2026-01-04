import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DocsPage } from "@/components/ui/DocsPage";
import { DocsSection } from "@/components/ui/DocsSection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.preSales.orgOwner.accessControl");
  
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AccessControlPage() {
  const t = await getTranslations("docs.preSales.orgOwner.accessControl");
  
  return (
    <DocsPage title={t("title")}>
      <DocsSection title={t("section1.title")}>
        <p>{t("section1.content")}</p>
      </DocsSection>
    </DocsPage>
  );
}
