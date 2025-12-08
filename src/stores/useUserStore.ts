import { create } from "zustand";
import { MembershipRole, ClubMembershipRole } from "@/constants/roles";

/**
 * User object type for the store
 */
export interface User {
  id: string;
  email: string | null;
  name: string | null;
  isRoot: boolean;
}

/**
 * Admin status response from API
 */
interface AdminStatusResponse {
  isAdmin: boolean;
  adminType: "root_admin" | "organization_admin" | "club_admin" | "none";
  managedIds: string[];
}

/**
 * User store state interface
 */
interface UserState {
  // State
  user: User | null;
  roles: string[];
  isLoggedIn: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setRoles: (roles: string[]) => void;
  loadUser: () => Promise<void>;
  clearUser: () => void;
  
  // Role checks
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

/**
 * Zustand store for managing authenticated user state and roles.
 * 
 * This store is the centralized source of truth for:
 * - User authentication state
 * - User roles (ROOT_ADMIN, ORGANIZATION_ADMIN, CLUB_ADMIN)
 * - Role-based authorization helpers
 * 
 * All role checks should be done through this store's helpers (hasRole, hasAnyRole)
 * to maintain consistency across the application.
 * 
 * @example
 * // Check if user has a specific role
 * const hasRole = useUserStore(state => state.hasRole);
 * if (hasRole("ROOT_ADMIN")) {
 *   // Root admin only logic
 * }
 * 
 * @example
 * // Check if user has any of multiple roles
 * const hasAnyRole = useUserStore(state => state.hasAnyRole);
 * if (hasAnyRole(["ROOT_ADMIN", "ORGANIZATION_ADMIN"])) {
 *   // Admin logic
 * }
 * 
 * @example
 * // Load user on app start
 * const loadUser = useUserStore(state => state.loadUser);
 * useEffect(() => {
 *   loadUser();
 * }, []);
 */
export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  user: null,
  roles: [],
  isLoggedIn: false,
  isLoading: false,

  /**
   * Set the current user and update isLoggedIn status
   */
  setUser: (user: User | null) => {
    set({
      user,
      isLoggedIn: !!user,
    });
  },

  /**
   * Set the roles for the current user
   */
  setRoles: (roles: string[]) => {
    set({ roles });
  },

  /**
   * Load the current user from the API
   * Fetches user info from /api/me and admin status from /api/me/admin-status
   */
  loadUser: async () => {
    set({ isLoading: true });
    try {
      // Fetch user info
      const meResponse = await fetch("/api/me");
      
      if (!meResponse.ok) {
        // User is not authenticated
        set({
          user: null,
          roles: [],
          isLoggedIn: false,
          isLoading: false,
        });
        return;
      }

      const userData = await meResponse.json();
      
      // Build user object
      const user: User = {
        id: userData.userId,
        email: userData.email,
        name: userData.name,
        isRoot: userData.isRoot,
      };

      // Fetch admin status to determine roles
      const adminStatusResponse = await fetch("/api/me/admin-status");
      let roles: string[] = [];

      if (adminStatusResponse.ok) {
        const adminStatus: AdminStatusResponse = await adminStatusResponse.json();
        
        // Build roles array based on admin status
        if (adminStatus.adminType === "root_admin") {
          roles = ["ROOT_ADMIN"];
        } else if (adminStatus.adminType === "organization_admin") {
          roles = ["ORGANIZATION_ADMIN"];
        } else if (adminStatus.adminType === "club_admin") {
          roles = ["CLUB_ADMIN"];
        }
      }

      set({
        user,
        roles,
        isLoggedIn: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load user:", error);
      set({
        user: null,
        roles: [],
        isLoggedIn: false,
        isLoading: false,
      });
    }
  },

  /**
   * Clear user state (logout)
   */
  clearUser: () => {
    set({
      user: null,
      roles: [],
      isLoggedIn: false,
      isLoading: false,
    });
  },

  /**
   * Check if the current user has a specific role
   * 
   * Supported roles:
   * - ROOT_ADMIN: Platform root administrator
   * - ORGANIZATION_ADMIN: Organization administrator
   * - CLUB_ADMIN: Club administrator
   * - MEMBER: Organization or club member (context-dependent)
   * 
   * @param role - The role to check
   * @returns true if the user has the role, false otherwise
   */
  hasRole: (role: string) => {
    const { roles } = get();
    return roles.includes(role);
  },

  /**
   * Check if the current user has any of the specified roles
   * 
   * @param roles - Array of roles to check
   * @returns true if the user has at least one of the roles, false otherwise
   */
  hasAnyRole: (roles: string[]) => {
    const { roles: userRoles } = get();
    return roles.some(role => userRoles.includes(role));
  },
}));

/**
 * Convenience hook to check if user is logged in
 */
export const useIsLoggedIn = () => useUserStore(state => state.isLoggedIn);

/**
 * Convenience hook to check if user has a specific role
 */
export const useHasRole = (role: string) => useUserStore(state => state.hasRole(role));

/**
 * Convenience hook to check if user has any of the specified roles
 */
export const useHasAnyRole = (roles: string[]) => useUserStore(state => state.hasAnyRole(roles));

/**
 * Convenience hook to get the current user
 */
export const useCurrentUser = () => useUserStore(state => state.user);

// Export role enums for convenience
export { MembershipRole, ClubMembershipRole };
