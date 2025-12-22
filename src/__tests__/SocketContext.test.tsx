/**
 * Tests for SocketProvider Connection Logic
 * 
 * Verifies that the socket only connects when both:
 * - User is authenticated (valid session)
 * - activeClubId is non-null
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { SocketProvider, useSocket } from '@/contexts/SocketContext';

// Mock next-auth
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// Mock ClubContext
const mockActiveClubId = jest.fn();
jest.mock('@/contexts/ClubContext', () => ({
  useActiveClub: () => ({
    activeClubId: mockActiveClubId(),
    setActiveClubId: jest.fn(),
  }),
}));

// Mock AuthStore
const mockGetSocketToken = jest.fn();
const mockClearSocketToken = jest.fn();
jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: any) => {
    const mockStore = {
      getSocketToken: mockGetSocketToken,
      clearSocketToken: mockClearSocketToken,
    };
    return selector(mockStore);
  },
}));

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
  id: 'test-socket-id',
  connected: false,
  io: {
    on: jest.fn(),
    off: jest.fn(),
  },
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Test component that uses the socket
function TestComponent() {
  const { socket, isConnected } = useSocket();
  return (
    <div>
      <div data-testid="socket-status">{socket ? 'connected' : 'disconnected'}</div>
      <div data-testid="is-connected">{isConnected ? 'true' : 'false'}</div>
    </div>
  );
}

describe('SocketProvider Connection Logic', () => {
  let ioSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSocketToken.mockResolvedValue('mock-token');
    
    // Get reference to the mocked io function
    const socketIo = require('socket.io-client');
    ioSpy = jest.spyOn(socketIo, 'io');
  });

  it('should NOT connect when user is not authenticated', async () => {
    // User not authenticated
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    mockActiveClubId.mockReturnValue('club-123');

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      // Socket should NOT be initialized
      expect(ioSpy).not.toHaveBeenCalled();
    });
  });

  it('should NOT connect when activeClubId is null', async () => {
    // User authenticated but no active club
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    mockActiveClubId.mockReturnValue(null);

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      // Socket should NOT be initialized
      expect(ioSpy).not.toHaveBeenCalled();
    });
  });

  it('should connect ONLY when both authenticated AND activeClubId are available', async () => {
    // User authenticated AND active club is set
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    mockActiveClubId.mockReturnValue('club-123');

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      // Socket SHOULD be initialized with correct auth
      expect(mockGetSocketToken).toHaveBeenCalled();
      expect(ioSpy).toHaveBeenCalledWith({
        path: '/socket.io',
        auth: {
          token: 'mock-token',
          clubId: 'club-123',
        },
      });
    });
  });

  it('should disconnect when activeClubId becomes null', async () => {
    // Start with both authenticated and active club
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    mockActiveClubId.mockReturnValue('club-123');

    const { rerender } = render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(ioSpy).toHaveBeenCalled();
    });

    // Now set activeClubId to null
    mockActiveClubId.mockReturnValue(null);

    rerender(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      // Socket should be disconnected
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  it('should reconnect when activeClubId changes to a different club', async () => {
    // Start with club-123
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    mockActiveClubId.mockReturnValue('club-123');

    const { rerender } = render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(ioSpy).toHaveBeenCalledWith({
        path: '/socket.io',
        auth: {
          token: 'mock-token',
          clubId: 'club-123',
        },
      });
    });

    // Change to club-456
    mockActiveClubId.mockReturnValue('club-456');
    jest.clearAllMocks(); // Clear previous calls
    ioSpy.mockClear();

    rerender(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      // Old socket should be disconnected
      expect(mockSocket.disconnect).toHaveBeenCalled();
      // New socket should be created with new clubId
      expect(ioSpy).toHaveBeenCalledWith({
        path: '/socket.io',
        auth: {
          token: 'mock-token',
          clubId: 'club-456',
        },
      });
    });
  });

  it('should NOT reconnect if token fetch fails', async () => {
    // Simulate token fetch failure
    mockGetSocketToken.mockResolvedValue(null);

    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    mockActiveClubId.mockReturnValue('club-123');

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      // Socket should NOT be initialized if token is null
      expect(mockGetSocketToken).toHaveBeenCalled();
      expect(ioSpy).not.toHaveBeenCalled();
    });
  });

  it('should clear socket token on logout', async () => {
    // Start authenticated
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    mockActiveClubId.mockReturnValue('club-123');

    const { rerender } = render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(ioSpy).toHaveBeenCalled();
    });

    // User logs out
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    rerender(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      // Socket should be disconnected
      expect(mockSocket.disconnect).toHaveBeenCalled();
      // Token should be cleared
      expect(mockClearSocketToken).toHaveBeenCalled();
    });
  });
});
