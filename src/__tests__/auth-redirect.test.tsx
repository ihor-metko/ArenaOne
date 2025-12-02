/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
const mockPush = jest.fn();
const mockPathname = "/clubs/123";
const mockSearchParams = {
  toString: () => "",
  get: jest.fn((key: string) => {
    if (key === "redirectTo") return "/clubs/123";
    return null;
  }),
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "auth.promptTitle": "Sign in required",
      "auth.promptMessage": "Please sign in to continue",
      "auth.continueBrowsing": "Continue Browsing",
      "common.register": "Register",
      "common.signIn": "Sign In",
    };
    return translations[key] || key;
  },
}));

// Mock UI components
jest.mock("@/components/ui", () => ({
  Modal: ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose} data-testid="close-modal">Close</button>
        {children}
      </div>
    );
  },
  Button: ({ onClick, children, variant, className }: { onClick?: () => void; children: React.ReactNode; variant?: string; className?: string }) => (
    <button onClick={onClick} data-testid={`button-${variant || 'default'}`} className={className}>
      {children}
    </button>
  ),
}));

import { AuthPromptModal } from "@/components/AuthPromptModal";

describe("AuthPromptModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render when isOpen is true", () => {
    const onClose = jest.fn();
    render(<AuthPromptModal isOpen={true} onClose={onClose} />);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    const onClose = jest.fn();
    render(<AuthPromptModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("should call router.push with redirectTo parameter when login button is clicked", () => {
    const onClose = jest.fn();
    render(<AuthPromptModal isOpen={true} onClose={onClose} />);

    // Find and click the sign in button
    const signInButton = screen.getByText("Sign In");
    fireEvent.click(signInButton);

    // Verify that router.push was called with the correct URL including redirectTo
    expect(mockPush).toHaveBeenCalledWith(
      `/auth/sign-in?redirectTo=${encodeURIComponent(mockPathname)}`
    );
  });

  it("should call router.push with redirectTo parameter when register button is clicked", () => {
    const onClose = jest.fn();
    render(<AuthPromptModal isOpen={true} onClose={onClose} />);

    // Find and click the register button
    const registerButton = screen.getByText("Register");
    fireEvent.click(registerButton);

    // Verify that router.push was called with the correct URL including redirectTo
    expect(mockPush).toHaveBeenCalledWith(
      `/auth/sign-up?redirectTo=${encodeURIComponent(mockPathname)}`
    );
  });

  it("should call onClose when continue browsing button is clicked", () => {
    const onClose = jest.fn();
    render(<AuthPromptModal isOpen={true} onClose={onClose} />);

    // Find and click the continue browsing button
    const continueButton = screen.getByText("Continue Browsing");
    fireEvent.click(continueButton);

    expect(onClose).toHaveBeenCalled();
  });
});

describe("Auth redirect URL construction", () => {
  it("should properly encode the redirect URL", () => {
    const complexPath = "/clubs/123?date=2024-01-01&court=abc";
    const encoded = encodeURIComponent(complexPath);
    
    // Verify encoding works correctly
    expect(encoded).toBe("%2Fclubs%2F123%3Fdate%3D2024-01-01%26court%3Dabc");
    expect(decodeURIComponent(encoded)).toBe(complexPath);
  });

  it("should handle simple paths", () => {
    const simplePath = "/clubs/123";
    const encoded = encodeURIComponent(simplePath);
    
    expect(decodeURIComponent(encoded)).toBe(simplePath);
  });
});
