import "./DocsScreenshot.css";

export type UserRole = "root-admin" | "org-owner" | "org-admin" | "club-owner" | "club-admin";

export interface DocsImagePlaceholderProps {
  /** User role for the screenshot */
  role: UserRole;
  /** Step name (filename without extension) */
  step: string;
  /** Alt text for the screenshot */
  alt: string;
  /** Optional caption below the screenshot */
  caption?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DocsImagePlaceholder Component
 *
 * Automatically loads screenshots from Storage/docs-screenshots based on role and step.
 * If the screenshot doesn't exist, displays a placeholder.
 *
 * @example
 * <DocsImagePlaceholder 
 *   role="club-admin"
 *   step="quick-booking"
 *   alt="Quick booking process"
 *   caption="The quick booking interface for club administrators"
 * />
 */
export function DocsImagePlaceholder({
  role,
  step,
  alt,
  caption,
  className = "",
}: DocsImagePlaceholderProps) {
  // Generate the image path based on role and step
  const imagePath = `/Storage/docs-screenshots/${role}/${step}.png`;

  return (
    <figure className={`im-docs-screenshot ${className}`.trim()}>
      <div className="im-docs-screenshot-container">
        <img 
          src={imagePath} 
          alt={alt} 
          className="im-docs-screenshot-image"
          loading="lazy"
          onError={(e) => {
            // If image fails to load, replace with placeholder
            const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="im-docs-screenshot-placeholder">
                  <span class="im-docs-screenshot-placeholder-icon">🖼️</span>
                  <span class="im-docs-screenshot-placeholder-text">${alt}</span>
                </div>
              `;
            }
          }}
        />
      </div>
      {caption && (
        <figcaption className="im-docs-screenshot-caption">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
