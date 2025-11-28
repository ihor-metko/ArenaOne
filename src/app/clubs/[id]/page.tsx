"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { BookingModal } from "@/components/booking/BookingModal";

interface Court {
  id: string;
  name: string;
  indoor: boolean;
  defaultPrice: number;
}

interface Coach {
  id: string;
  name: string;
}

interface Club {
  id: string;
  name: string;
  location: string;
}

interface ClubWithDetails extends Club {
  courts: Court[];
  coaches: Coach[];
}

interface Slot {
  startTime: string;
  endTime: string;
}

function generateDefaultSlots(): Slot[] {
  const today = new Date();
  const slots: Slot[] = [];
  for (let hour = 9; hour < 18; hour++) {
    const start = new Date(today);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(today);
    end.setHours(hour + 1, 0, 0, 0);
    slots.push({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
  }
  return slots;
}

export default function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [club, setClub] = useState<ClubWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClubData() {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/clubs/${resolvedParams.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Club not found");
          } else {
            setError("Failed to load club data");
          }
          return;
        }
        const data = await response.json();
        setClub(data);
      } catch {
        setError("Failed to load club data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchClubData();
  }, [params]);

  const handleBookClick = (courtId: string) => {
    setSelectedCourtId(courtId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourtId(null);
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <main className="tm-club-page min-h-screen p-8">
        <div className="text-center text-gray-500">Loading club data...</div>
      </main>
    );
  }

  if (error || !club) {
    return (
      <main className="tm-club-page min-h-screen p-8">
        <div className="text-center text-red-500">{error || "Club not found"}</div>
        <div className="mt-4 text-center">
          <Link href="/clubs" className="text-blue-500 hover:underline">
            ← Back to Clubs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="tm-club-page min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{club.name}</h1>
        <p className="text-gray-500 mt-2">{club.location}</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {club.courts.length === 0 ? (
          <div className="col-span-full text-gray-500">
            No courts available at this club.
          </div>
        ) : (
          club.courts.map((court) => (
            <Card key={court.id} title={court.name} className="tm-court-card">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Surface:</span>{" "}
                  {court.indoor ? "Indoor" : "Outdoor"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Default Price:</span>{" "}
                  {formatPrice(court.defaultPrice)}
                </p>
              </div>
              <div className="mt-4">
                <Button
                  className="tm-book-button"
                  onClick={() => handleBookClick(court.id)}
                >
                  Book
                </Button>
              </div>
            </Card>
          ))
        )}
      </section>

      <div className="mt-8">
        <Link href="/clubs" className="text-blue-500 hover:underline">
          ← Back to Clubs
        </Link>
      </div>

      {selectedCourtId && (
        <BookingModal
          courtId={selectedCourtId}
          availableSlots={generateDefaultSlots()}
          coachList={club.coaches}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          userId="current-user-placeholder"
        />
      )}
    </main>
  );
}
