"use client";

import { useState, useCallback } from "react";
import { DashboardFooter, AdminSidebar } from "@/components/layout";
import Header from "@/components/layout/Header";

/**
 * Admin Pages Layout
 * Layout for admin-related pages with header, sidebar, and sticky footer structure.
 * The sidebar is role-based and renders dynamically based on user permissions.
 * Supports collapsible sidebar for maximizing content area on desktop.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  }, []);

  // Dynamic padding based on sidebar state
  // Expanded: lg:pl-60 (240px), Collapsed: lg:pl-16 (64px)
  const contentPaddingClass = isSidebarCollapsed 
    ? "lg:pl-16" 
    : "lg:pl-60";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Sidebar - renders based on admin role */}
      <AdminSidebar 
        hasHeader={true}
        onCollapsedChange={handleSidebarCollapsedChange}
      />

      {/* Main content area with dynamic sidebar offset */}
      <div className={`flex-1 overflow-auto flex flex-col w-full ${contentPaddingClass} transition-[padding-left] duration-300 ease-in-out`}>
        {children}

        <DashboardFooter />
      </div>
    </div>
  );
}
