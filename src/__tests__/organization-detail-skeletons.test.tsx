import { render, screen } from "@testing-library/react";
import OrgInfoCardSkeleton from "@/components/ui/skeletons/OrgInfoCardSkeleton";
import ClubsPreviewSkeleton from "@/components/ui/skeletons/ClubsPreviewSkeleton";
import BookingsPreviewSkeleton from "@/components/ui/skeletons/BookingsPreviewSkeleton";

describe("Organization Detail Page - Skeleton Components", () => {
  describe("OrgInfoCardSkeleton", () => {
    it("renders with default props", () => {
      render(<OrgInfoCardSkeleton />);
      expect(screen.getByText("Loading organization information...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders with custom number of items", () => {
      const { container } = render(<OrgInfoCardSkeleton items={8} />);
      const items = container.querySelectorAll(".im-org-info-skeleton-item");
      expect(items).toHaveLength(8);
    });

    it("renders with custom className", () => {
      const { container } = render(<OrgInfoCardSkeleton className="custom-class" />);
      const card = container.querySelector(".im-section-card.custom-class");
      expect(card).toBeInTheDocument();
    });

    it("has proper aria attributes for accessibility", () => {
      render(<OrgInfoCardSkeleton />);
      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-busy", "true");
      expect(status).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("ClubsPreviewSkeleton", () => {
    it("renders with default props", () => {
      render(<ClubsPreviewSkeleton />);
      expect(screen.getByText("Loading clubs...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders with custom count", () => {
      const { container } = render(<ClubsPreviewSkeleton count={5} />);
      const items = container.querySelectorAll(".im-club-preview-skeleton-item");
      expect(items).toHaveLength(5);
    });

    it("renders section header skeleton", () => {
      const { container } = render(<ClubsPreviewSkeleton />);
      const header = container.querySelector(".im-section-header");
      expect(header).toBeInTheDocument();
    });

    it("has proper aria attributes for accessibility", () => {
      render(<ClubsPreviewSkeleton />);
      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-busy", "true");
      expect(status).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("BookingsPreviewSkeleton", () => {
    it("renders with default props", () => {
      render(<BookingsPreviewSkeleton />);
      expect(screen.getByText("Loading bookings...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders with custom count", () => {
      const { container } = render(<BookingsPreviewSkeleton count={3} />);
      const items = container.querySelectorAll(".im-booking-preview-skeleton-item");
      expect(items).toHaveLength(3);
    });

    it("renders summary skeleton with 3 items", () => {
      const { container } = render(<BookingsPreviewSkeleton />);
      const summaryItems = container.querySelectorAll(".im-bookings-summary-skeleton-item");
      expect(summaryItems).toHaveLength(3);
    });

    it("renders section header with action button skeleton", () => {
      const { container } = render(<BookingsPreviewSkeleton />);
      const actions = container.querySelector(".im-section-actions");
      expect(actions).toBeInTheDocument();
    });

    it("has proper aria attributes for accessibility", () => {
      render(<BookingsPreviewSkeleton />);
      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-busy", "true");
      expect(status).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Skeleton Styling and Animation", () => {
    it("OrgInfoCardSkeleton applies im-skeleton class for shimmer animation", () => {
      const { container } = render(<OrgInfoCardSkeleton />);
      const skeletons = container.querySelectorAll(".im-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("ClubsPreviewSkeleton applies im-skeleton class for shimmer animation", () => {
      const { container } = render(<ClubsPreviewSkeleton />);
      const skeletons = container.querySelectorAll(".im-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("BookingsPreviewSkeleton applies im-skeleton class for shimmer animation", () => {
      const { container } = render(<BookingsPreviewSkeleton />);
      const skeletons = container.querySelectorAll(".im-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
