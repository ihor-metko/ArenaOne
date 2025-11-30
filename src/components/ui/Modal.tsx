"use client";

import { useEffect, useRef, useCallback } from "react";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Selector for focusable elements within the modal
const FOCUSABLE_ELEMENTS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle focus trapping within the modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(FOCUSABLE_ELEMENTS);
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // If no focusable elements, prevent tabbing
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      // Handle Shift+Tab (backward navigation)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Handle Tab (forward navigation)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element to restore later
      previousActiveElement.current = document.activeElement;

      // Add event listeners
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      // Focus the first focusable element in the modal
      // Using requestAnimationFrame ensures the DOM is fully rendered before focusing
      const animationFrameId = requestAnimationFrame(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            FOCUSABLE_ELEMENTS
          ) as HTMLElement;
          firstFocusable?.focus();
        }
      });

      return () => {
        cancelAnimationFrame(animationFrameId);
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";

        // Restore focus to the previously focused element
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="rsp-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="rsp-modal"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <button
          className="rsp-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        {title && (
          <div className="rsp-modal-header" id="modal-title">
            {title}
          </div>
        )}
        <div className="rsp-modal-body">{children}</div>
      </div>
    </div>
  );
}
