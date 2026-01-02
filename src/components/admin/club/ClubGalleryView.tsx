"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button, Tooltip } from "@/components/ui";
import { SectionEditModal } from "./SectionEditModal";
import { useAdminClubStore } from "@/stores/useAdminClubStore";
import { isValidImageUrl, getImageUrl } from "@/utils/image";
import type { ClubDetail } from "@/types/club";
import "./ClubGalleryView.css";

interface GalleryImage {
  id?: string;
  imageUrl: string;
  imageKey?: string | null;
  altText?: string | null;
  sortOrder: number;
  file?: File;
  preview?: string;
}

interface ClubGalleryViewProps {
  club: ClubDetail;
  disabled?: boolean;
  disabledTooltip?: string;
}

export function ClubGalleryView({ club, disabled = false, disabledTooltip }: ClubGalleryViewProps) {
  const t = useTranslations("clubDetail");
  const tCommon = useTranslations("common");
  const updateClubInStore = useAdminClubStore((state) => state.updateClubInStore);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(club.bannerData?.url || null);
  const [logoUrl, setLogoUrl] = useState<string | null>(club.logoData?.url || null);
  const [gallery, setGallery] = useState<GalleryImage[]>(() =>
    club.gallery.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      imageKey: img.imageKey,
      altText: img.altText,
      sortOrder: img.sortOrder,
    }))
  );

  const heroInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = useCallback(() => {
    setBannerUrl(club.bannerData?.url || null);
    setLogoUrl(club.logoData?.url || null);
    setGallery(
      club.gallery.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        imageKey: img.imageKey,
        altText: img.altText,
        sortOrder: img.sortOrder,
      }))
    );
    setError("");
    setIsEditing(true);
  }, [club]);

  const handleClose = useCallback(() => {
    // Revoke any blob URLs
    gallery.forEach((img) => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setIsEditing(false);
    setError("");
  }, [gallery]);

  const uploadFile = useCallback(async (file: File, type: "logo" | "heroImage" | "gallery"): Promise<{ url: string; key?: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch(`/api/images/clubs/${club.id}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || t("failedToUploadImages"));
    }

    const result = await response.json();
    return {
      url: result.url,
      key: result.filename || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      filename: result.filename,
    };
  }, [club.id, t]);

  const handleHeroUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError("");
      try {
        const { url } = await uploadFile(file, "heroImage");
        setBannerUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToUploadHeroImage"));
      } finally {
        setIsUploading(false);
        if (heroInputRef.current) {
          heroInputRef.current.value = "";
        }
      }
    },
    [uploadFile, t]
  );

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError("");
      try {
        const { url } = await uploadFile(file, "logo");
        setLogoUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToUploadLogo"));
      } finally {
        setIsUploading(false);
        if (logoInputRef.current) {
          logoInputRef.current.value = "";
        }
      }
    },
    [uploadFile, t]
  );

  const handleGalleryUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setIsUploading(true);
      setError("");
      try {
        const newImages: GalleryImage[] = [];
        for (const file of files) {
          const { url, key } = await uploadFile(file, "gallery");
          newImages.push({
            imageUrl: url,
            imageKey: key,
            altText: file.name,
            sortOrder: gallery.length + newImages.length,
          });
        }
        setGallery((prev) => [...prev, ...newImages]);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToUploadImages"));
      } finally {
        setIsUploading(false);
        if (galleryInputRef.current) {
          galleryInputRef.current.value = "";
        }
      }
    },
    [gallery.length, uploadFile, t]
  );

  const handleRemoveGalleryImage = useCallback((index: number) => {
    const image = gallery[index];

    // Revoke blob URL if exists
    if (image.preview) {
      URL.revokeObjectURL(image.preview);
    }

    // Remove from local state
    // The actual database update will happen when Save is clicked
    setGallery((prev) => prev.filter((_, i) => i !== index));
  }, [gallery]);

  const handleSetHeroFromGallery = useCallback((imageUrl: string) => {
    setBannerUrl(imageUrl);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/clubs/${club.id}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bannerData: bannerUrl ? { url: bannerUrl } : null,
          logoData: logoUrl ? { url: logoUrl } : null,
          gallery: gallery.map((img, index) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            imageKey: img.imageKey || null,
            altText: img.altText || null,
            sortOrder: index,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("failedToUpdateMedia"));
      }

      const result = await response.json();
      
      // According to the migration guide, this endpoint returns { success: true }
      // We need to optimistically update the club in the store
      if (result.success) {
        updateClubInStore(club.id, {
          bannerData: bannerUrl ? { url: bannerUrl } : null,
          logoData: logoUrl ? { url: logoUrl } : null,
          gallery: gallery.map((img, index) => ({
            id: img.id || crypto.randomUUID(),
            imageUrl: img.imageUrl,
            imageKey: img.imageKey || null,
            altText: img.altText || null,
            sortOrder: index,
          })),
        });
      }

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToSaveChanges"));
    } finally {
      setIsSaving(false);
    }
  }, [bannerUrl, logoUrl, gallery, club.id, updateClubInStore, t]);

  return (
    <>
      <div className="im-section-view-header">
        <h2 className="im-club-view-section-title">{t("gallery")}</h2>
        <Tooltip
          content={disabled ? disabledTooltip : undefined}
          position="bottom"
        >
          <Button
            variant="outline"
            onClick={handleEdit}
            disabled={disabled}
          >
            {tCommon("edit")}
          </Button>
        </Tooltip>
      </div>

      <div className="im-section-view">
        <div className="im-gallery-view-hero">
          {isValidImageUrl(club.bannerData?.url) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={getImageUrl(club.bannerData?.url) ?? ""}
              alt={t("clubHeroAlt")}
              className="im-gallery-view-hero-img"
            />
          ) : (
            <div className="im-gallery-view-placeholder">{t("noHeroImage")}</div>
          )}
        </div>

        {club.gallery.length > 0 && (
          <div className="im-gallery-view-thumbnails">
            {club.gallery.map((img) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={img.id}
                src={getImageUrl(img.imageUrl) ?? ""}
                alt={img.altText || t("galleryImageAlt")}
                className="im-gallery-view-thumb"
              />
            ))}
          </div>
        )}
      </div>

      <SectionEditModal
        isOpen={isEditing}
        onClose={handleClose}
        title={t("editGallery")}
        onSave={handleSave}
        isSaving={isSaving}
      >
        {error && <div className="im-section-edit-modal-error">{error}</div>}

        <div className="im-gallery-edit-section">
          <h3 className="im-gallery-edit-section-title">{t("heroImage")}</h3>
          <div className="im-gallery-edit-hero">
            {isValidImageUrl(bannerUrl) ? (
              <div className="im-gallery-edit-hero-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(bannerUrl) ?? ""} alt={t("heroPreviewAlt")} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBannerUrl(null)}
                  className="im-gallery-edit-remove"
                  disabled={isSaving || isUploading}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="im-gallery-edit-upload-btn"
                onClick={() => heroInputRef.current?.click()}
                disabled={isSaving || isUploading}
              >
                {isUploading ? t("uploading") : t("uploadHeroImage")}
              </button>
            )}
            <input
              ref={heroInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleHeroUpload}
              className="hidden"
              disabled={isSaving || isUploading}
            />
          </div>
        </div>

        <div className="im-gallery-edit-section">
          <h3 className="im-gallery-edit-section-title">{t("logo")}</h3>
          <div className="im-gallery-edit-logo">
            {isValidImageUrl(logoUrl) ? (
              <div className="im-gallery-edit-logo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(logoUrl) ?? ""} alt={t("logoPreviewAlt")} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLogoUrl(null)}
                  className="im-gallery-edit-remove"
                  disabled={isSaving || isUploading}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="im-gallery-edit-upload-btn"
                onClick={() => logoInputRef.current?.click()}
                disabled={isSaving || isUploading}
              >
                {isUploading ? t("uploading") : t("uploadLogo")}
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={isSaving || isUploading}
            />
          </div>
        </div>

        <div className="im-gallery-edit-section">
          <div className="im-gallery-edit-section-header">
            <h3 className="im-gallery-edit-section-title">{t("galleryImages")}</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isSaving || isUploading}
            >
              {isUploading ? t("uploading") : t("addImages")}
            </Button>
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleGalleryUpload}
            className="hidden"
            disabled={isSaving || isUploading}
          />
          {gallery.length > 0 ? (
            <div className="im-gallery-edit-grid">
              {gallery.map((img, index) => (
                <div key={img.id || index} className="im-gallery-edit-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview || (getImageUrl(img.imageUrl) ?? "")}
                    alt={img.altText || t("galleryImageIndexAlt", { index: index + 1 })}
                  />
                  <div className="im-gallery-edit-item-actions">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSetHeroFromGallery(img.imageUrl)}
                      className="im-gallery-edit-set-hero"
                      disabled={isSaving || isUploading}
                    >
                      {t("setAsHero")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveGalleryImage(index)}
                      className="im-gallery-edit-remove"
                      disabled={isSaving || isUploading}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="im-section-view-value--empty">{t("noGalleryImages")}</p>
          )}
        </div>
      </SectionEditModal>
    </>
  );
}
