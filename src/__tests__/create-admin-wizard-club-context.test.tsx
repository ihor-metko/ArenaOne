/**
 * Test to verify that in club context:
 * 1. Organization selector is hidden
 * 2. Club selector is visible but disabled
 * 3. Role selector is editable
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { SelectContextStep } from "@/components/admin/admin-wizard/SelectContextStep";
import type { ContextSelectionData, AdminWizardErrors } from "@/types/adminWizard";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      organization: "Organization",
      club: "Club",
      role: "Role",
      organizationPlaceholder: "Select organization",
      clubPlaceholder: "Select club",
      rolePlaceholder: "Select role",
      "roles.clubAdmin": "Club Admin",
      "roles.clubOwner": "Club Owner",
      clubPreselectedHint: "This club is pre-selected",
    };
    return translations[key] || key;
  },
}));

// Mock UI components
jest.mock("@/components/ui", () => ({
  Select: ({ id, label, disabled, value, options }: { 
    id: string; 
    label: string; 
    disabled?: boolean;
    value?: string;
    options: Array<{ value: string; label: string }>;
  }) => (
    <div data-testid={`select-${id}`}>
      <label>{label}</label>
      <select disabled={disabled} value={value} data-testid={`${id}-input`}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe("SelectContextStep - Club Context", () => {
  const mockOnChange = jest.fn();
  const errors: AdminWizardErrors = {};
  
  const organizationData = { id: "org-1", name: "Test Org", slug: "test-org" };
  const clubData = { id: "club-1", name: "Test Club", organizationId: "org-1" };
  
  const data: ContextSelectionData = {
    organizationId: "org-1",
    clubId: "club-1",
    role: "CLUB_ADMIN",
  };

  it("should hide organization selector in club context", () => {
    render(
      <SelectContextStep
        data={data}
        onChange={mockOnChange}
        errors={errors}
        disabled={false}
        organizations={[organizationData]}
        clubs={[clubData]}
        allowedRoles={["CLUB_ADMIN", "CLUB_OWNER"]}
        isOrgEditable={false}
        isClubEditable={false}
        isRoleEditable={true}
        showClubSelector={false} // In club context
        showOrganizationSelector={false} // In club context - should hide
      />
    );

    // Organization selector should NOT be present
    expect(screen.queryByTestId("select-organization")).not.toBeInTheDocument();
  });

  it("should show club selector as disabled in club context", () => {
    render(
      <SelectContextStep
        data={data}
        onChange={mockOnChange}
        errors={errors}
        disabled={false}
        organizations={[organizationData]}
        clubs={[clubData]}
        allowedRoles={["CLUB_ADMIN", "CLUB_OWNER"]}
        isOrgEditable={false}
        isClubEditable={false} // Club is not editable in club context
        isRoleEditable={true}
        showClubSelector={false} // In club context
        showOrganizationSelector={false} // In club context
      />
    );

    // Club selector should be present
    const clubSelect = screen.getByTestId("select-club");
    expect(clubSelect).toBeInTheDocument();
    
    // Club input should be disabled
    const clubInput = screen.getByTestId("club-input") as HTMLSelectElement;
    expect(clubInput).toBeDisabled();
  });

  it("should show role selector as enabled in club context", () => {
    render(
      <SelectContextStep
        data={data}
        onChange={mockOnChange}
        errors={errors}
        disabled={false}
        organizations={[organizationData]}
        clubs={[clubData]}
        allowedRoles={["CLUB_ADMIN", "CLUB_OWNER"]}
        isOrgEditable={false}
        isClubEditable={false}
        isRoleEditable={true} // Role is editable
        showClubSelector={false} // In club context
        showOrganizationSelector={false} // In club context
      />
    );

    // Role selector should be present
    const roleSelect = screen.getByTestId("select-role");
    expect(roleSelect).toBeInTheDocument();
    
    // Role input should NOT be disabled (it's editable)
    const roleInput = screen.getByTestId("role-input") as HTMLSelectElement;
    expect(roleInput).not.toBeDisabled();
  });

  it("should show organization selector in organization context", () => {
    render(
      <SelectContextStep
        data={data}
        onChange={mockOnChange}
        errors={errors}
        disabled={false}
        organizations={[organizationData]}
        clubs={[clubData]}
        allowedRoles={["ORGANIZATION_ADMIN", "CLUB_ADMIN"]}
        isOrgEditable={false}
        isClubEditable={true}
        isRoleEditable={true}
        showClubSelector={true} // In organization context
        showOrganizationSelector={true} // Should show organization selector
      />
    );

    // Organization selector should be present in organization context
    expect(screen.getByTestId("select-organization")).toBeInTheDocument();
  });

  it("should hide club selector when role is ORGANIZATION_ADMIN", () => {
    const orgData: ContextSelectionData = {
      organizationId: "org-1",
      clubId: undefined,
      role: "ORGANIZATION_ADMIN",
    };

    render(
      <SelectContextStep
        data={orgData}
        onChange={mockOnChange}
        errors={errors}
        disabled={false}
        organizations={[organizationData]}
        clubs={[clubData]}
        allowedRoles={["ORGANIZATION_ADMIN", "CLUB_ADMIN"]}
        isOrgEditable={false}
        isClubEditable={true}
        isRoleEditable={true}
        showClubSelector={true} // In organization context
        showOrganizationSelector={true}
      />
    );

    // Club selector should NOT be present when role is ORGANIZATION_ADMIN
    expect(screen.queryByTestId("select-club")).not.toBeInTheDocument();
  });

  it("should show club selector when role is CLUB_ADMIN in organization context", () => {
    const clubAdminData: ContextSelectionData = {
      organizationId: "org-1",
      clubId: "club-1",
      role: "CLUB_ADMIN",
    };

    render(
      <SelectContextStep
        data={clubAdminData}
        onChange={mockOnChange}
        errors={errors}
        disabled={false}
        organizations={[organizationData]}
        clubs={[clubData]}
        allowedRoles={["ORGANIZATION_ADMIN", "CLUB_ADMIN"]}
        isOrgEditable={false}
        isClubEditable={true}
        isRoleEditable={true}
        showClubSelector={true} // In organization context
        showOrganizationSelector={true}
      />
    );

    // Club selector should be present when role is CLUB_ADMIN
    expect(screen.getByTestId("select-club")).toBeInTheDocument();
  });
});
