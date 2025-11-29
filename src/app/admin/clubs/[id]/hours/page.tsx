"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Modal } from "@/components/ui";
import { UserRoleIndicator } from "@/components/UserRoleIndicator";

interface DayHours {
  open: number | null;
  close: number | null;
}

interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface SpecialHours {
  id: string;
  date: string;
  openTime: number;
  closeTime: number;
}

interface Club {
  id: string;
  name: string;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<typeof DAYS[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function formatHour(hour: number | null): string {
  if (hour === null) return "-";
  return `${hour.toString().padStart(2, "0")}:00`;
}

export default function AdminClubHoursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clubId, setClubId] = useState<string | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours | null>(null);
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Weekly hours edit state
  const [editingWeekly, setEditingWeekly] = useState(false);
  const [weeklyForm, setWeeklyForm] = useState<WeeklyHours | null>(null);

  // Special hours modal state
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);
  const [specialForm, setSpecialForm] = useState({
    date: "",
    openTime: 9,
    closeTime: 22,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setClubId(resolvedParams.id);
    });
  }, [params]);

  const fetchClub = useCallback(async () => {
    if (!clubId) return;

    try {
      const response = await fetch(`/api/clubs/${clubId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Club not found");
          return;
        }
        throw new Error("Failed to fetch club");
      }
      const data = await response.json();
      setClub(data);
    } catch {
      setError("Failed to load club");
    }
  }, [clubId]);

  const fetchWeeklyHours = useCallback(async () => {
    if (!clubId) return;

    try {
      const response = await fetch(`/api/clubs/${clubId}/weekly-hours`);
      if (!response.ok) {
        throw new Error("Failed to fetch weekly hours");
      }
      const data = await response.json();
      setWeeklyHours(data);
      setWeeklyForm(data);
    } catch {
      setError("Failed to load weekly hours");
    }
  }, [clubId]);

  const fetchSpecialHours = useCallback(async () => {
    if (!clubId) return;

    try {
      // Get special hours for the next 90 days
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 90);
      
      const startDate = today.toISOString().split("T")[0];
      const endDate = futureDate.toISOString().split("T")[0];

      const response = await fetch(
        `/api/clubs/${clubId}/special-hours?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch special hours");
      }
      const data = await response.json();
      setSpecialHours(data.specialHours || []);
    } catch {
      setError("Failed to load special hours");
    }
  }, [clubId]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || session.user.role !== "admin") {
      router.push("/auth/sign-in");
      return;
    }

    if (clubId) {
      setLoading(true);
      Promise.all([fetchClub(), fetchWeeklyHours(), fetchSpecialHours()])
        .finally(() => setLoading(false));
    }
  }, [session, status, router, clubId, fetchClub, fetchWeeklyHours, fetchSpecialHours]);

  const handleWeeklyChange = (
    day: typeof DAYS[number],
    field: "open" | "close",
    value: string
  ) => {
    if (!weeklyForm) return;
    
    setWeeklyForm({
      ...weeklyForm,
      [day]: {
        ...weeklyForm[day],
        [field]: value === "" ? null : parseInt(value, 10),
      },
    });
  };

  const handleSaveWeekly = async () => {
    if (!clubId || !weeklyForm) return;

    setSubmitting(true);
    setError("");
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/weekly-hours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weeklyForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save weekly hours");
      }

      const data = await response.json();
      setWeeklyHours(data);
      setWeeklyForm(data);
      setEditingWeekly(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelWeekly = () => {
    setWeeklyForm(weeklyHours);
    setEditingWeekly(false);
  };

  const handleOpenSpecialModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSpecialForm({
      date: tomorrow.toISOString().split("T")[0],
      openTime: 9,
      closeTime: 22,
    });
    setIsSpecialModalOpen(true);
  };

  const handleCloseSpecialModal = () => {
    setIsSpecialModalOpen(false);
  };

  const handleSaveSpecial = async () => {
    if (!clubId) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/clubs/${clubId}/special-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save special hours");
      }

      handleCloseSpecialModal();
      fetchSpecialHours();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (date: string) => {
    setDeletingDate(date);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingDate(null);
  };

  const handleDeleteSpecial = async () => {
    if (!clubId || !deletingDate) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/clubs/${clubId}/special-hours/${deletingDate}`,
        { method: "DELETE" }
      );

      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      handleCloseDeleteModal();
      fetchSpecialHours();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
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

  return (
    <main className="rsp-container min-h-screen p-8">
      <header className="rsp-header flex items-center justify-between mb-8">
        <div>
          <h1 className="rsp-title text-3xl font-bold">
            Business Hours - {club?.name || "Loading..."}
          </h1>
          <p className="rsp-subtitle text-gray-500 mt-2">
            Manage opening hours for this club
          </p>
        </div>
        <div className="flex items-center gap-4">
          <UserRoleIndicator />
        </div>
      </header>

      <section className="rsp-content">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/admin/clubs"
            className="rsp-link text-blue-500 hover:underline"
          >
            ← Back to Clubs
          </Link>
        </div>

        {error && (
          <div className="rsp-error bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Weekly Hours Section */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Weekly Schedule</h2>
              {!editingWeekly && (
                <Button variant="outline" onClick={() => setEditingWeekly(true)}>
                  Edit
                </Button>
              )}
            </div>
            
            {weeklyForm && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--rsp-border)" }}>
                      <th className="py-2 px-3 font-semibold">Day</th>
                      <th className="py-2 px-3 font-semibold">Open</th>
                      <th className="py-2 px-3 font-semibold">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day} className="border-b" style={{ borderColor: "var(--rsp-border)" }}>
                        <td className="py-2 px-3 font-medium">{DAY_LABELS[day]}</td>
                        <td className="py-2 px-3">
                          {editingWeekly ? (
                            <select
                              value={weeklyForm[day].open ?? ""}
                              onChange={(e) => handleWeeklyChange(day, "open", e.target.value)}
                              className="px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            >
                              <option value="">Closed</option>
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, "0")}:00
                                </option>
                              ))}
                            </select>
                          ) : (
                            formatHour(weeklyForm[day].open)
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {editingWeekly ? (
                            <select
                              value={weeklyForm[day].close ?? ""}
                              onChange={(e) => handleWeeklyChange(day, "close", e.target.value)}
                              className="px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            >
                              <option value="">Closed</option>
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {(i + 1).toString().padStart(2, "0")}:00
                                </option>
                              ))}
                            </select>
                          ) : (
                            formatHour(weeklyForm[day].close)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {editingWeekly && (
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelWeekly}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveWeekly} disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Special Hours Section */}
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Special Hours / Date Overrides</h2>
              <Button onClick={handleOpenSpecialModal}>+ Add Override</Button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Add special hours for specific dates (holidays, events, etc.) to override the weekly schedule.
            </p>

            {specialHours.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No special hours scheduled.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--rsp-border)" }}>
                      <th className="py-2 px-3 font-semibold">Date</th>
                      <th className="py-2 px-3 font-semibold">Open</th>
                      <th className="py-2 px-3 font-semibold">Close</th>
                      <th className="py-2 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specialHours.map((sh) => (
                      <tr key={sh.id} className="border-b" style={{ borderColor: "var(--rsp-border)" }}>
                        <td className="py-2 px-3 font-medium">
                          {new Date(sh.date + "T00:00:00").toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-2 px-3">{formatHour(sh.openTime)}</td>
                        <td className="py-2 px-3">{formatHour(sh.closeTime)}</td>
                        <td className="py-2 px-3 text-right">
                          <Button
                            variant="outline"
                            onClick={() => handleOpenDeleteModal(sh.date)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Add Special Hours Modal */}
      <Modal
        isOpen={isSpecialModalOpen}
        onClose={handleCloseSpecialModal}
        title="Add Special Hours"
      >
        <div className="space-y-4">
          <Input
            label="Date"
            name="date"
            type="date"
            value={specialForm.date}
            onChange={(e) => setSpecialForm({ ...specialForm, date: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Open Time</label>
              <select
                value={specialForm.openTime}
                onChange={(e) =>
                  setSpecialForm({ ...specialForm, openTime: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Close Time</label>
              <select
                value={specialForm.closeTime}
                onChange={(e) =>
                  setSpecialForm({ ...specialForm, closeTime: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {(i + 1).toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCloseSpecialModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveSpecial} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Delete Special Hours"
      >
        <p className="mb-4">
          Are you sure you want to delete the special hours for{" "}
          {deletingDate && new Date(deletingDate + "T00:00:00").toLocaleDateString()}?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSpecial}
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
