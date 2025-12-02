import "./auth.css";

/**
 * Auth Layout
 * Authentication pages layout without header for a cleaner auth experience.
 * Features a full-screen background image with semi-transparent overlay.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-auto">
      {/* Full-screen background image */}
      <div className="im-auth-background" aria-hidden="true" />
      
      {/* Semi-transparent overlay */}
      <div className="im-auth-overlay" aria-hidden="true" />
      
      {/* Decorative elements */}
      <div className="im-auth-decorative" aria-hidden="true" />
      
      {/* Main content */}
      <main className="im-auth-container">
        {children}
      </main>
    </div>
  );
}
