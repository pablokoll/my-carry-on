import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { BagSummary, Trip } from "@/lib/queries";
import { daysUntil, formatDate } from "@/lib/utils";

export function ActiveTripCard({ trip }: { trip: Trip }) {
  const days = daysUntil(trip.start_date);
  const pct =
    (trip.items_total ?? 0) === 0
      ? 0
      : Math.round(((trip.items_packed ?? 0) / (trip.items_total ?? 1)) * 100);
  const allDone =
    (trip.items_total ?? 0) > 0 && trip.items_packed === trip.items_total;
  const bags = (trip.bags ?? []) as BagSummary[];

  return (
    <Link href={`/trips/${trip.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "28px",
          boxShadow: "var(--shadow-sm)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "99px",
                  background: allDone
                    ? "rgba(94,164,110,0.15)"
                    : "rgba(74,123,181,0.1)",
                  color: allDone ? "#5ea46e" : "var(--primary)",
                  letterSpacing: "0.04em",
                }}
              >
                {allDone ? "READY" : "ACTIVE"}
              </span>
              {days !== null && (
                <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>
                  {days === 0
                    ? "Today!"
                    : days < 0
                      ? `${Math.abs(days)}d ago`
                      : `${days}d to go`}
                </span>
              )}
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              {trip.name}
            </h2>
            {(trip.start_date || trip.end_date) && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--fg-muted)",
                  margin: "4px 0 0",
                }}
              >
                {formatDate(trip.start_date) ?? "—"} →{" "}
                {formatDate(trip.end_date) ?? "—"}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: allDone ? "#5ea46e" : "var(--primary)",
                lineHeight: 1,
              }}
            >
              {pct}%
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--fg-muted)",
                marginTop: "2px",
              }}
            >
              packed
            </div>
          </div>
        </div>

        {(trip.items_total ?? 0) > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <ProgressBar
              value={trip.items_packed ?? 0}
              total={trip.items_total ?? 0}
              color={allDone ? "#5ea46e" : "var(--primary)"}
            />
            <p
              style={{
                fontSize: "12px",
                color: "var(--fg-muted)",
                margin: "6px 0 0",
              }}
            >
              {trip.items_packed} / {trip.items_total} items packed
            </p>
          </div>
        )}

        {bags.length > 0 ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {bags.map((bag) => {
              const bagDone =
                bag.items_total > 0 && bag.items_packed === bag.items_total;
              return (
                <div key={bag.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--foreground)",
                        }}
                      >
                        {bag.name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--fg-muted)",
                          background: "var(--bg-surface)",
                          borderRadius: "4px",
                          padding: "1px 6px",
                        }}
                      >
                        {bag.type}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: bagDone ? "#5ea46e" : "var(--fg-muted)",
                        fontWeight: bagDone ? 600 : 400,
                      }}
                    >
                      {bag.items_total === 0
                        ? "empty"
                        : bagDone
                          ? "done"
                          : `${bag.items_packed}/${bag.items_total}`}
                    </span>
                  </div>
                  <ProgressBar
                    value={bag.items_packed}
                    total={bag.items_total}
                    color={bagDone ? "#5ea46e" : "var(--primary)"}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--fg-muted)", margin: 0 }}>
            No bags assigned yet.
          </p>
        )}
      </div>
    </Link>
  );
}
