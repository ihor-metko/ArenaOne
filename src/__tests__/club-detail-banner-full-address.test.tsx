/**
 * Test to verify that the club detail page banner displays the full address
 * from the location field, not just city and country.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the EntityBanner component to capture props
let capturedBannerProps: any = null;
jest.mock('@/components/ui', () => ({
  EntityBanner: (props: any) => {
    capturedBannerProps = props;
    return (
      <div data-testid="entity-banner">
        <h1>{props.title}</h1>
        {props.location && <p data-testid="banner-location">{props.location}</p>}
      </div>
    );
  },
  Breadcrumbs: () => <div>Breadcrumbs</div>,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  IMLink: ({ children, href }: any) => <a href={href}>{children}</a>,
  ImageCarousel: () => <div>ImageCarousel</div>,
  CourtCarousel: () => <div>CourtCarousel</div>,
}));

// Mock other components
jest.mock('@/components/booking/BookingModal', () => ({
  BookingModal: () => null,
}));

jest.mock('@/components/PlayerQuickBooking', () => ({
  PlayerQuickBooking: () => null,
}));

jest.mock('@/components/CourtCard', () => ({
  CourtCard: () => <div>CourtCard</div>,
}));

jest.mock('@/components/WeeklyAvailabilityTimeline', () => ({
  WeeklyAvailabilityTimeline: () => <div>WeeklyAvailabilityTimeline</div>,
}));

jest.mock('@/components/CourtAvailabilityModal', () => ({
  CourtAvailabilityModal: () => null,
}));

jest.mock('@/components/CourtScheduleModal', () => ({
  CourtScheduleModal: () => null,
}));

jest.mock('@/components/AuthPromptModal', () => ({
  AuthPromptModal: () => null,
}));

jest.mock('@/components/GalleryModal', () => ({
  GalleryModal: () => null,
}));

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => <div>ClubMap</div>,
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/clubs/test-club',
}));

// Mock stores
jest.mock('@/stores/usePlayerClubStore', () => ({
  usePlayerClubStore: (selector: any) => {
    const mockClub = {
      id: 'club-123',
      name: 'Test Tennis Club',
      slug: 'test-tennis-club',
      shortDescription: 'A great tennis club',
      longDescription: 'This is a detailed description of our tennis club.',
      location: '123 Main Street, Downtown, Springfield, IL 62701',
      city: 'Springfield',
      country: 'USA',
      latitude: 39.7817,
      longitude: -89.6501,
      phone: '+1-555-0123',
      email: 'info@testtennisclub.com',
      website: 'https://testtennisclub.com',
      socialLinks: null,
      contactInfo: null,
      openingHours: null,
      logoData: { url: 'https://example.com/logo.png' },
      bannerData: { url: 'https://example.com/banner.png' },
      metadata: null,
      defaultCurrency: 'USD',
      timezone: 'America/Chicago',
      tags: null,
      businessHours: [],
    };

    const store = {
      currentClub: mockClub,
      ensureClubById: jest.fn(),
      ensureCourtsByClubId: jest.fn(),
      ensureGalleryByClubId: jest.fn(),
      getCourtsForClub: () => [],
      getGalleryForClub: () => [],
      loadingClubs: false,
      loadingCourts: false,
      clubsError: null,
    };

    return selector(store);
  },
}));

jest.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: any) => {
    const store = {
      user: null,
      isLoggedIn: false,
    };
    return selector(store);
  },
}));

jest.mock('@/contexts/ClubContext', () => ({
  useActiveClub: () => ({
    setActiveClubId: jest.fn(),
  }),
}));

jest.mock('@/utils/image', () => ({
  isValidImageUrl: (url: any) => !!url,
  getImageUrl: (url: any) => url,
}));

jest.mock('@/types/club', () => ({
  parseClubMetadata: () => undefined,
}));

describe('Club Detail Banner - Full Address Display', () => {
  beforeEach(() => {
    capturedBannerProps = null;
  });

  it('should display the full address from location field in the banner', async () => {
    // Import the component dynamically to ensure mocks are applied
    const ClubDetailPage = (await import('@/app/(pages)/(player)/clubs/[id]/page')).default;

    render(
      <ClubDetailPage
        params={Promise.resolve({ id: 'club-123' })}
      />
    );

    // Wait for the component to render
    await screen.findByTestId('entity-banner');

    // Verify that EntityBanner was called with the full location address
    expect(capturedBannerProps).not.toBeNull();
    expect(capturedBannerProps.location).toBe('123 Main Street, Downtown, Springfield, IL 62701');
    
    // Verify it's not using the short format (city, country)
    expect(capturedBannerProps.location).not.toBe('Springfield, USA');
  });
});
