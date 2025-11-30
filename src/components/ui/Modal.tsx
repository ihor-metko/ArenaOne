"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const t = useTranslations("modal");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="rsp-modal-overlay" onClick={onClose}>
      <div className="rsp-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="rsp-modal-close"
          onClick={onClose}
          aria-label={t("closeModal")}
        >
          ✕
        </button>
        {title && <div className="rsp-modal-header">{title}</div>}
        <div className="rsp-modal-body">{children}</div>
      </div>
    </div>
  );
}
