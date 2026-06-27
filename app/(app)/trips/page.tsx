"use client";

import Link from "next/link";
import { useState } from "react";
import { CreateTripModal } from "@/components/create-trip-modal";
import { type Trip, useTrips } from "@/lib/queries";

export default function TripsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: trips = [], isLoading } = useTrips();

  if (isLoading) {
    return (
      <p className="text-[color:var(--fg-muted)] text-sm text-center pt-12">
        Loading…
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-foreground m-0">Trips</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setModalOpen(true)}
        >
          New trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center pt-16">
          <p className="text-[color:var(--fg-muted)] text-[15px] mb-5">
            No trips yet.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setModalOpen(true)}
          >
            Plan your first trip
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {trips.map((trip: Trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="no-underline"
            >
              <div className="bg-card border border-border rounded-[10px] p-4 cursor-pointer card-hover shadow-[var(--shadow-xs-val)]">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-foreground">
                    {trip.name}
                  </span>
                  {trip.is_active && (
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[rgba(74,123,181,0.1)] text-primary">
                      Active
                    </span>
                  )}
                </div>
                {(trip.start_date || trip.end_date) && (
                  <p className="text-[13px] text-[color:var(--fg-muted)] mt-1 mb-0">
                    {trip.start_date ?? "—"} → {trip.end_date ?? "—"}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateTripModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setModalOpen(false)}
      />
    </>
  );
}
