"use client";

import PlayerMobileHeader from "@/components/layout/PlayerMobileHeader";
import { PlayerMobileFooter } from "@/components/layout/PlayerMobileFooter";
import Header from "@/components/layout/Header";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useIsMobile } from "@/hooks";

export default function PlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen overflow-auto">
      {isMobile ? <PlayerMobileHeader /> : <Header />}

      <div className="flex-1 w-7xl mx-auto w-full">
        {children}
      </div>

      {isMobile ? <PlayerMobileFooter /> : <PublicFooter />}
    </div>
  );
}
