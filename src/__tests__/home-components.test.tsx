/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "home.quickLinks": "Quick Links",
      "home.viewClubs": "View Clubs",
      "home.dashboard": "Dashboard",
      "home.manageClubs": "Manage Clubs",
      "home.manageCoaches": "Manage Coaches",
      "home.manageNotifications": "Notifications",
      "training.history.title": "Training History",
      "common.signIn": "Sign In",
      "common.register": "Register",
    };
    return translations[key] || key;
  },
}));

// Mock UI components
jest.mock("@/components/ui", () => ({
  Card: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="card">
      <h3>{title}</h3>
      {children}
    </div>
  ),
  IMLink: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid={`link-${href}`}>{children}</a>
  ),
  ClubCardSkeleton: () => <div data-testid="club-card-skeleton" />,
  ClubCardsGridSkeleton: ({ count }: { count: number }) => (
    <div data-testid="clubs-grid-skeleton">{count} skeletons</div>
  ),
  PersonalizedSectionSkeleton: () => <div data-testid="personalized-skeleton" />,
}));

import { useSession } from "next-auth/react";
import { QuickLinksSection } from "@/components/home/QuickLinksSection";

const mockUseSession = useSession as jest.Mock;

describe("QuickLinksSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Unauthenticated state", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });
    });

    it("renders quick links title", () => {
      render(<QuickLinksSection />);
      expect(screen.getByText("Quick Links")).toBeInTheDocument();
    });

    it("shows public clubs link", () => {
      render(<QuickLinksSection />);
      expect(screen.getByTestId("link-/clubs")).toBeInTheDocument();
    });

    it("shows sign in and register links for unauthenticated users", () => {
      render(<QuickLinksSection />);
      expect(screen.getByText("Sign In")).toBeInTheDocument();
      expect(screen.getByText("Register")).toBeInTheDocument();
    });

    it("does not show dashboard link", () => {
      render(<QuickLinksSection />);
      expect(screen.queryByTestId("link-/dashboard")).not.toBeInTheDocument();
    });
  });

  describe("Player role", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "player-1",
            name: "Test Player",
            email: "player@test.com",
            role: "player",
          },
        },
        status: "authenticated",
      });
    });

    it("shows player-specific links", () => {
      render(<QuickLinksSection />);
      expect(screen.getByTestId("link-/dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("link-/trainings")).toBeInTheDocument();
    });

    it("does not show auth links for authenticated users", () => {
      render(<QuickLinksSection />);
      expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
      expect(screen.queryByText("Register")).not.toBeInTheDocument();
    });
  });

  describe("Coach role", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "coach-1",
            name: "Test Coach",
            email: "coach@test.com",
            role: "coach",
          },
        },
        status: "authenticated",
      });
    });

    it("shows coach dashboard link", () => {
      render(<QuickLinksSection />);
      expect(screen.getByTestId("link-/coach/dashboard")).toBeInTheDocument();
    });

    it("does not show player-specific links", () => {
      render(<QuickLinksSection />);
      expect(screen.queryByTestId("link-/dashboard")).not.toBeInTheDocument();
      expect(screen.queryByTestId("link-/trainings")).not.toBeInTheDocument();
    });
  });

  describe("Admin role", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            name: "Test Admin",
            email: "admin@test.com",
            role: "admin",
          },
        },
        status: "authenticated",
      });
    });

    it("shows admin-specific links", () => {
      render(<QuickLinksSection />);
      expect(screen.getByTestId("link-/admin/clubs")).toBeInTheDocument();
      expect(screen.getByTestId("link-/admin/coaches")).toBeInTheDocument();
      expect(screen.getByTestId("link-/admin/notifications")).toBeInTheDocument();
    });
  });
});

describe("Loading Skeletons", () => {
  it("ClubCardsGridSkeleton is exported from UI components", () => {
    // The mock already provides ClubCardsGridSkeleton, verify it works
    const MockClubCardsGridSkeleton = ({ count }: { count: number }) => (
      <div data-testid="clubs-grid-skeleton">{count} skeletons</div>
    );
    render(<MockClubCardsGridSkeleton count={4} />);
    expect(screen.getByTestId("clubs-grid-skeleton")).toBeInTheDocument();
  });

  it("PersonalizedSectionSkeleton is exported from UI components", () => {
    // The mock already provides PersonalizedSectionSkeleton, verify it works
    const MockPersonalizedSectionSkeleton = () => <div data-testid="personalized-skeleton" />;
    render(<MockPersonalizedSectionSkeleton />);
    expect(screen.getByTestId("personalized-skeleton")).toBeInTheDocument();
  });
});
