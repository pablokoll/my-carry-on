"use client";

import Link from "next/link";
import { useState } from "react";
import { ActiveTripCard } from "@/components/active-trip-card";
import { CreateTripModal } from "@/components/create-trip-modal";
import { type Trip, useCreateTrip, useTrips } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: trips = [], isLoading } = useTrips();
  const createTrip = useCreateTrip();

  if (isLoading) {
    return (
      <p className="text-[color:var(--fg-muted)] text-sm text-center pt-12">
        Loading…
      </p>
    );
  }

  const activeTrip = trips.find((t: Trip) => t.is_active);
  const otherTrips = trips.filter((t: Trip) => !t.is_active);

  return (
    <>
      {activeTrip && <ActiveTripCard trip={activeTrip} />}

      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-semibold text-foreground m-0">
          {activeTrip ? "Other trips" : "Your trips"}
        </h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setModalOpen(true)}
        >
          New trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center pt-12">
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
      ) : otherTrips.length === 0 && activeTrip ? (
        <p className="text-[13px] text-[color:var(--fg-muted)]">
          No other trips.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {otherTrips.map((trip: Trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="no-underline"
            >
              <div className="bg-card border border-border rounded-[10px] px-4 py-3.5 cursor-pointer flex items-center justify-between gap-3 hover:shadow-[var(--shadow-md-val)] transition-shadow duration-[180ms]">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-foreground block overflow-hidden text-ellipsis whitespace-nowrap">
                    {trip.name}
                  </span>
                  {(trip.start_date || trip.end_date) && (
                    <span className="text-xs text-[color:var(--fg-muted)]">
                      {formatDate(trip.start_date) ?? "—"} →{" "}
                      {formatDate(trip.end_date) ?? "—"}
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {(trip.items_total ?? 0) > 0 ? (
                    <span className="text-xs text-[color:var(--fg-muted)]">
                      {Math.round(
                        ((trip.items_packed ?? 0) / (trip.items_total ?? 1)) *
                          100,
                      )}
                      % packed
                    </span>
                  ) : (
                    <span className="text-xs text-[color:var(--fg-muted)]">
                      {(trip.bags ?? []).length} bag
                      {(trip.bags ?? []).length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateTripModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          createTrip.reset();
        }}
      />
    </>
  );
}
