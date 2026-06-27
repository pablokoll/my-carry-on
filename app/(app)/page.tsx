"use client";

import Link from "next/link";
import { useState } from "react";
import { ActiveTripCard } from "@/components/active-trip-card";
import { CreateTripModal } from "@/components/create-trip-modal";
import { type Trip, useCreateTrip, useTrips } from "@/lib/queries";
import { btnPrimary } from "@/lib/styles";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: trips = [], isLoading } = useTrips();
  const createTrip = useCreateTrip();

  if (isLoading) {
    return (
      <p
        style={{
          color: "var(--fg-muted)",
          fontSize: "14px",
          textAlign: "center",
          paddingTop: "48px",
        }}
      >
        Loading…
      </p>
    );
  }

  const activeTrip = trips.find((t: Trip) => t.is_active);
  const otherTrips = trips.filter((t: Trip) => !t.is_active);

  return (
    <>
      {activeTrip && <ActiveTripCard trip={activeTrip} />}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          {activeTrip ? "Other trips" : "Your trips"}
        </h2>
        <button
          type="button"
          style={btnPrimary}
          onClick={() => setModalOpen(true)}
        >
          New trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: "48px" }}>
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "15px",
              marginBottom: "20px",
            }}
          >
            No trips yet.
          </p>
          <button
            type="button"
            style={btnPrimary}
            onClick={() => setModalOpen(true)}
          >
            Plan your first trip
          </button>
        </div>
      ) : otherTrips.length === 0 && activeTrip ? (
        <p style={{ fontSize: "13px", color: "var(--fg-muted)" }}>
          No other trips.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {otherTrips.map((trip: Trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {trip.name}
                  </span>
                  {(trip.start_date || trip.end_date) && (
                    <span
                      style={{ fontSize: "12px", color: "var(--fg-muted)" }}
                    >
                      {formatDate(trip.start_date) ?? "—"} →{" "}
                      {formatDate(trip.end_date) ?? "—"}
                    </span>
                  )}
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  {(trip.items_total ?? 0) > 0 ? (
                    <span
                      style={{ fontSize: "12px", color: "var(--fg-muted)" }}
                    >
                      {Math.round(
                        ((trip.items_packed ?? 0) / (trip.items_total ?? 1)) *
                          100,
                      )}
                      % packed
                    </span>
                  ) : (
                    <span
                      style={{ fontSize: "12px", color: "var(--fg-muted)" }}
                    >
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
