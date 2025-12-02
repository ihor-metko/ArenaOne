/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mock the react-leaflet components to avoid DOM issues in tests
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children, className }: { children: React.ReactNode; className: string }) => (
    <div data-testid="map-container" className={className}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    setView: jest.fn(),
  }),
}));

// Mock Leaflet
jest.mock("leaflet", () => ({
  icon: jest.fn(() => ({})),
  Marker: {
    prototype: {
      options: {},
    },
  },
}));

import { ClubMap } from "@/components/ClubMap";

describe("ClubMap", () => {
  it("renders with valid coordinates", () => {
    render(
      <ClubMap
        latitude={40.7128}
        longitude={-74.006}
        clubName="Test Club"
      />
    );

    // Check the wrapper has correct accessibility attributes
    const wrapper = screen.getByRole("application");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute("aria-label", "Map showing location of Test Club");
  });

  it("renders map container with correct className", () => {
    render(
      <ClubMap
        latitude={40.7128}
        longitude={-74.006}
        clubName="Test Club"
      />
    );

    const mapContainer = screen.getByTestId("map-container");
    expect(mapContainer).toHaveClass("rsp-club-map");
  });

  it("renders with custom className", () => {
    render(
      <ClubMap
        latitude={40.7128}
        longitude={-74.006}
        clubName="Test Club"
        className="custom-class"
      />
    );

    const wrapper = screen.getByRole("application");
    expect(wrapper).toHaveClass("rsp-club-map-wrapper");
    expect(wrapper).toHaveClass("custom-class");
  });

  it("renders marker and popup with club name", () => {
    render(
      <ClubMap
        latitude={40.7128}
        longitude={-74.006}
        clubName="Test Club"
      />
    );

    const marker = screen.getByTestId("marker");
    expect(marker).toBeInTheDocument();

    const popup = screen.getByTestId("popup");
    expect(popup).toHaveTextContent("Test Club");
  });

  it("uses coordinates directly without geocoding", () => {
    // This test verifies the component accepts coordinates directly
    // without any address geocoding logic
    render(
      <ClubMap
        latitude={51.5074}
        longitude={-0.1278}
        clubName="London Club"
      />
    );

    // The component should render without any geocoding errors
    expect(screen.getByRole("application")).toBeInTheDocument();
  });
});
