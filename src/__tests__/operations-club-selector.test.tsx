/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock stores
const mockClubStore = {
  clubs: [] as any[],
  fetchClubsIfNeeded: jest.fn().mockResolvedValue(undefined),
  loadingClubs: false,
  currentClub: null as any,
  setCurrentClub: jest.fn(),
};

const mockUserStore = {
  adminStatus: null as any,
  user: null as any,
};

jest.mock("@/stores/useClubStore", () => ({
  useClubStore: (selector: (state: typeof mockClubStore) => any) => {
    return selector(mockClubStore);
  },
}));

jest.mock("@/stores/useUserStore", () => ({
  useUserStore: (selector: (state: typeof mockUserStore) => any) => {
    return selector(mockUserStore);
  },
}));

// Mock UI Select component
jest.mock("@/components/ui", () => ({
  Select: ({ label, options, value, onChange, placeholder, disabled, className }: any) => (
    <div data-testid="select-wrapper" className={className}>
      {label && <label>{label}</label>}
      <select
        data-testid="select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

import { OperationsClubSelector } from "@/components/club-operations/OperationsClubSelector";

describe("OperationsClubSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClubStore.clubs = [];
    mockClubStore.loadingClubs = false;
    mockClubStore.currentClub = null;
    mockUserStore.adminStatus = null;
    mockUserStore.user = null;
  });

  describe("Loading State", () => {
    it("should show loading placeholder when loading", () => {
      mockClubStore.loadingClubs = true;
      mockUserStore.adminStatus = {
        adminType: "organization_admin",
        managedIds: ["org-1"],
      };

      render(<OperationsClubSelector value="" onChange={jest.fn()} />);

      const select = screen.getByTestId("select");
      expect(select).toHaveAttribute("aria-label", "Loading clubs...");
      expect(select).toBeDisabled();
    });

    it("should fetch clubs on mount", () => {
      mockUserStore.adminStatus = {
        adminType: "organization_admin",
        managedIds: ["org-1"],
      };

      render(<OperationsClubSelector value="" onChange={jest.fn()} />);

      expect(mockClubStore.fetchClubsIfNeeded).toHaveBeenCalled();
    });
  });

  describe("Empty State", () => {
    it("should show empty state message when no clubs available", () => {
      mockClubStore.clubs = [];
      mockClubStore.loadingClubs = false;
      mockUserStore.adminStatus = {
        adminType: "organization_admin",
        managedIds: ["org-1"],
      };

      render(<OperationsClubSelector value="" onChange={jest.fn()} />);

      const select = screen.getByTestId("select");
      expect(select).toHaveAttribute("aria-label", "No clubs available for this organization");
      expect(select).toBeDisabled();
    });
  });

  describe("Organization Admin", () => {
    it("should filter clubs by organization", () => {
      mockClubStore.clubs = [
        { id: "club-1", name: "Club 1", organizationId: "org-1" },
        { id: "club-2", name: "Club 2", organizationId: "org-2" },
        { id: "club-3", name: "Club 3", organizationId: "org-1" },
      ] as any[];
      mockClubStore.loadingClubs = false;
      mockUserStore.adminStatus = {
        adminType: "organization_admin",
        managedIds: ["org-1"],
      };

      render(<OperationsClubSelector value="" onChange={jest.fn()} />);

      // Should only show clubs from org-1
      const select = screen.getByTestId("select");
      const options = select.querySelectorAll("option");
      
      // Should have placeholder + 2 clubs (club-1 and club-3)
      expect(options.length).toBe(3);
      expect(options[1].textContent).toBe("Club 1");
      expect(options[2].textContent).toBe("Club 3");
    });

    it("should auto-select single club for org admin", async () => {
      mockClubStore.clubs = [
        { id: "club-1", name: "Club 1", organizationId: "org-1" },
      ] as any[];
      mockClubStore.loadingClubs = false;
      mockUserStore.adminStatus = {
        adminType: "organization_admin",
        managedIds: ["org-1"],
      };

      const onChange = jest.fn();
      render(<OperationsClubSelector value="" onChange={onChange} />);

      // Should auto-select the only club
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith("club-1");
      });
    });

    it("should NOT auto-select when multiple clubs exist", () => {
      mockClubStore.clubs = [
        { id: "club-1", name: "Club 1", organizationId: "org-1" },
        { id: "club-2", name: "Club 2", organizationId: "org-1" },
      ] as any[];
      mockClubStore.loadingClubs = false;
      mockUserStore.adminStatus = {
        adminType: "organization_admin",
        managedIds: ["org-1"],
      };

      const onChange = jest.fn();
      render(<OperationsClubSelector value="" onChange={onChange} />);

      // Should NOT auto-select
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Root Admin", () => {
    it("should show all clubs for root admin", () => {
      mockClubStore.clubs = [
        { id: "club-1", name: "Club 1", organizationId: "org-1" },
        { id: "club-2", name: "Club 2", organizationId: "org-2" },
        { id: "club-3", name: "Club 3", organizationId: "org-3" },
      ] as any[];
      mockClubStore.loadingClubs = false;
      mockUserStore.user = { isRoot: true };

      render(<OperationsClubSelector value="" onChange={jest.fn()} />);

      const select = screen.getByTestId("select");
      const options = select.querySelectorAll("option");
      
      // Should have placeholder + all 3 clubs
      expect(options.length).toBe(4);
    });
  });

  describe("Club Admin", () => {
    it("should filter to only managed clubs", () => {
      mockClubStore.clubs = [
        { id: "club-1", name: "Club 1", organizationId: "org-1" },
        { id: "club-2", name: "Club 2", organizationId: "org-1" },
      ] as any[];
      mockClubStore.loadingClubs = false;
      mockUserStore.adminStatus = {
        adminType: "club_admin",
        managedIds: ["club-1"],
      };

      render(<OperationsClubSelector value="" onChange={jest.fn()} />);

      const select = screen.getByTestId("select");
      const options = select.querySelectorAll("option");
      
      // Should only show club-1
      expect(options.length).toBe(2);
      expect(options[1].textContent).toBe("Club 1");
    });
  });

  describe("CurrentClub Integration", () => {
    it("should pre-select currentClub from store", async () => {
      mockClubStore.clubs = [
        { id: "club-1", name: "Club 1", organizationId: "org-1" },
        { id: "club-2", name: "Club 2", organizationId: "org-1" },
      ] as any[];
      mockClubStore.currentClub = { id: "club-2", name: "Club 2" } as any;
      mockClubStore.loadingClubs = false;
      mockUserStore.adminStatus = {
        adminType: "organization_admin",
        managedIds: ["org-1"],
      };

      const onChange = jest.fn();
      render(<OperationsClubSelector value="" onChange={onChange} />);

      // Should pre-select currentClub
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith("club-2");
      });
    });

    it("should persist selection to store", async () => {
      mockClubStore.clubs = [
        { id: "club-1", name: "Club 1", organizationId: "org-1" },
        { id: "club-2", name: "Club 2", organizationId: "org-1" },
      ] as any[];
      mockClubStore.loadingClubs = false;
      mockUserStore.adminStatus = {
        adminType: "organization_admin",
        managedIds: ["org-1"],
      };

      const onChange = jest.fn();
      
      render(<OperationsClubSelector value="" onChange={onChange} />);

      const select = screen.getByTestId("select");
      fireEvent.change(select, { target: { value: "club-1" } });

      // Should call setCurrentClub
      await waitFor(() => {
        expect(mockClubStore.setCurrentClub).toHaveBeenCalledWith(
          expect.objectContaining({ id: "club-1", name: "Club 1" })
        );
      });
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      mockClubStore.clubs = [
        { id: "club-1", name: "Club 1", organizationId: "org-1" },
      ] as any[];
      mockClubStore.loadingClubs = false;
      mockUserStore.adminStatus = {
        adminType: "club_admin",
        managedIds: ["club-1"],
      };

      render(<OperationsClubSelector value="club-1" onChange={jest.fn()} disabled={true} />);

      const select = screen.getByTestId("select");
      expect(select).toBeDisabled();
    });
  });
});
