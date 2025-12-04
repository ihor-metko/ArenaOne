import { UserRole } from "@/constants/roles";

declare module "next-auth" {
  interface User {
    isRoot?: boolean;
    /** @deprecated Use isRoot instead for admin checks */
    role?: UserRole;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isRoot?: boolean;
      /** @deprecated Use isRoot instead for admin checks */
      role?: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isRoot?: boolean;
    /** @deprecated Use isRoot instead for admin checks */
    role?: UserRole;
  }
}
