"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Modal, IMLink } from "@/components/ui";
import { UserRoleIndicator } from "@/components/UserRoleIndicator";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ClubEditStepper, StepperFormData } from "@/components/admin/club-stepper";
import type { ClubDetail } from "@/types/club";
import "./page.css";

export default function AdminClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clubId, setClubId] = useState<string | null>(null);
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setClubId(resolvedParams.id);
    });
  }, [params]);

  const fetchClub = useCallback(async () => {
    if (!clubId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/clubs/${clubId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Club not found");
          return;
        }
        if (response.status === 401 || response.status === 403) {
          router.push("/auth/sign-in");
          return;
        }
        throw new Error("Failed to fetch club");
      }
      const data = await response.json();
      setClub(data);
      setError("");
    } catch {
      setError("Failed to load club");
    } finally {
      setLoading(false);
    }
  }, [clubId, router]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || session.user.role !== "admin") {
      router.push("/auth/sign-in");
      return;
    }

    if (clubId) {
      fetchClub();
    }
  }, [session, status, router, clubId, fetchClub]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Upload file helper
  const uploadFile = useCallback(async (file: File): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Upload failed");
    }

    return response.json();
  }, []);

  // Generate slug from name
  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, []);

  const handleSaveStep = useCallback(async (step: number, formData: Partial<StepperFormData>) => {
    if (!clubId) return;

    try {
      let section: string;
      let payload: Record<string, unknown>;

      switch (step) {
        case 1: {
          section = "header";
          payload = {
            name: formData.name?.trim() || "",
            slug: formData.slug?.trim() || generateSlug(formData.name || ""),
            shortDescription: formData.shortDescription?.trim() || "",
            isPublic: formData.isPublic ?? club?.isPublic ?? false,
          };
          break;
        }
        case 2: {
          section = "contacts";
          payload = {
            location: formData.address?.trim() || "Address not provided",
            city: formData.city?.trim() || null,
            phone: formData.phone?.trim() || null,
            email: formData.email?.trim() || null,
            website: formData.website?.trim() || null,
          };
          break;
        }
        case 3: {
          section = "hours";
          payload = {
            businessHours: formData.businessHours || [],
            specialHours: [], // Preserve existing special hours
          };
          break;
        }
        case 4: {
          // Courts are managed separately via the existing court management
          // We'll use the courts section update to sync inline courts
          section = "courts";
          payload = {
            courts: (formData.courts || []).map((court) => ({
              id: court.id.startsWith("temp-") ? undefined : court.id,
              name: court.name,
              type: court.type || null,
              surface: court.surface || null,
              indoor: court.indoor,
              defaultPriceCents: court.defaultPriceCents,
            })),
          };
          break;
        }
        case 5: {
          section = "gallery";
          
          // Upload new files if any
          let logoData = { url: "", key: "" };
          const galleryData: { url: string; key: string }[] = [];

          if (formData.logo?.file) {
            logoData = await uploadFile(formData.logo.file);
          } else if (formData.logo?.url) {
            logoData = { url: formData.logo.url, key: formData.logo.key };
          }

          for (const galleryItem of formData.gallery || []) {
            if (galleryItem.file) {
              const uploaded = await uploadFile(galleryItem.file);
              galleryData.push(uploaded);
            } else if (galleryItem.url) {
              galleryData.push({ url: galleryItem.url, key: galleryItem.key });
            }
          }

          payload = {
            heroImage: logoData.url || club?.heroImage || null,
            logo: logoData.url || club?.logo || null,
            gallery: galleryData.map((img, index) => ({
              imageUrl: img.url,
              imageKey: img.key || null,
              altText: null,
              sortOrder: index,
            })),
          };
          break;
        }
        default:
          throw new Error("Invalid step");
      }

      const response = await fetch(`/api/admin/clubs/${clubId}/section`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, payload }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update section");
      }

      const updatedClub = await response.json();
      setClub(updatedClub);
    } catch (err) {
      throw err;
    }
  }, [clubId, club, generateSlug, uploadFile]);

  const handleDelete = async () => {
    if (!clubId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/clubs/${clubId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete club");
      }

      router.push("/admin/clubs");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to delete club");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="rsp-container min-h-screen p-8">
        <div className="rsp-loading text-center">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="rsp-container min-h-screen p-8">
        <div className="rsp-error bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm">
          {error}
        </div>
        <div className="mt-4">
          <IMLink href="/admin/clubs">← Back to Clubs</IMLink>
        </div>
      </main>
    );
  }

  if (!club) {
    return null;
  }

  return (
    <main className="rsp-container min-h-screen p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`im-toast ${toast.type === "success" ? "im-toast--success" : "im-toast--error"}`}
          role="alert"
        >
          {toast.message}
        </div>
      )}

      <header className="rsp-header flex items-center justify-between mb-8">
        <div>
          <h1 className="rsp-title text-3xl font-bold">{club.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`im-status-badge ${
                club.isPublic
                  ? "im-status-badge--published"
                  : "im-status-badge--unpublished"
              }`}
            >
              {club.isPublic ? "Published" : "Unpublished"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-red-500 hover:text-red-700"
          >
            Delete Club
          </Button>
          <NotificationBell />
          <UserRoleIndicator />
        </div>
      </header>

      <section className="rsp-content">
        <ClubEditStepper
          club={club}
          onSaveStep={handleSaveStep}
        />
      </section>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Club"
      >
        <p className="mb-4">
          Are you sure you want to delete &quot;{club.name}&quot;? This action
          cannot be undone and will also delete all associated courts, gallery
          images, and business hours.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={submitting}
            className="bg-red-500 hover:bg-red-600"
          >
            {submitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
