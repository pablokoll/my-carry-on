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
    <Link href={`/trips/${trip.id}`} className="no-underline block">
      <div className="bg-card border border-border rounded-[14px] p-5 mb-7 shadow-[var(--shadow-sm-val)] cursor-pointer hover:shadow-[var(--shadow-md-val)] transition-shadow duration-[180ms]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-[0.04em]"
                style={{
                  background: allDone
                    ? "rgba(94,164,110,0.15)"
                    : "rgba(74,123,181,0.1)",
                  color: allDone ? "#5ea46e" : "var(--primary)",
                }}
              >
                {allDone ? "READY" : "ACTIVE"}
              </span>
              {days !== null && (
                <span className="text-xs text-[color:var(--fg-muted)]">
                  {days === 0
                    ? "Today!"
                    : days < 0
                      ? `${Math.abs(days)}d ago`
                      : `${days}d to go`}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground m-0">
              {trip.name}
            </h2>
            {(trip.start_date || trip.end_date) && (
              <p className="text-[13px] text-[color:var(--fg-muted)] mt-1 mb-0">
                {formatDate(trip.start_date) ?? "—"} →{" "}
                {formatDate(trip.end_date) ?? "—"}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div
              className="text-[28px] font-bold leading-none"
              style={{ color: allDone ? "#5ea46e" : "var(--primary)" }}
            >
              {pct}%
            </div>
            <div className="text-[11px] text-[color:var(--fg-muted)] mt-0.5">
              packed
            </div>
          </div>
        </div>

        {(trip.items_total ?? 0) > 0 && (
          <div className="mb-4">
            <ProgressBar
              value={trip.items_packed ?? 0}
              total={trip.items_total ?? 0}
              color={allDone ? "#5ea46e" : "var(--primary)"}
            />
            <p className="text-xs text-[color:var(--fg-muted)] mt-1.5 mb-0">
              {trip.items_packed} / {trip.items_total} items packed
            </p>
          </div>
        )}

        {bags.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {bags.map((bag) => {
              const bagDone =
                bag.items_total > 0 && bag.items_packed === bag.items_total;
              return (
                <div key={bag.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-foreground">
                        {bag.name}
                      </span>
                      <span className="text-[11px] text-[color:var(--fg-muted)] bg-[var(--bg-surface)] rounded px-1.5 py-px">
                        {bag.type}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${bagDone ? "font-semibold" : "font-normal"}`}
                      style={{ color: bagDone ? "#5ea46e" : "var(--fg-muted)" }}
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
          <p className="text-[13px] text-[color:var(--fg-muted)] m-0">
            No bags assigned yet.
          </p>
        )}
      </div>
    </Link>
  );
}
