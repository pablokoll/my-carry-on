"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BagItemsTable,
  type Category,
  type Item,
} from "@/components/bag-items-table";
import { CreateBagModal } from "@/components/create-bag-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Dialog } from "@/components/ui/dialog";
import { TypeBadge } from "@/components/ui/type-badge";
import type { Bag } from "@/lib/queries";
import {
  type BagWithItems,
  type Destination,
  keys,
  useAddDestination,
  useAllBags,
  useAssignBag,
  useCategories,
  useDeleteDestination,
  useDeleteTrip,
  useToggleTripActive,
  useTripBags,
  useTripDestinations,
  useTripDetail,
  useUnassignBag,
  useUpdateDestination,
  useUpdateTrip,
} from "@/lib/queries";
import {
  btnPrimary,
  errorStyle,
  inputStyle,
  labelStyle,
  rowStyle,
  sectionHeader,
  submitBtnStyle,
} from "@/lib/styles";
import { useBagAssignment } from "./use-bag-assignment";
import { useDestinationForm } from "./use-destination-form";
import { useTripEditForm } from "./use-trip-edit";

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: trip, isLoading } = useTripDetail(id);
  const { data: destinations = [], isLoading: destLoading } =
    useTripDestinations(id);
  const { data: tripBags = [] } = useTripBags(id);
  const { data: allBags = [] } = useAllBags();
  const { data: categories = [] } = useCategories();

  const updateTrip = useUpdateTrip(id);
  const deleteTrip = useDeleteTrip(id);
  const toggleActive = useToggleTripActive(id);
  const addDest = useAddDestination(id);
  const updateDest = useUpdateDestination(id);
  const deleteDest = useDeleteDestination(id);
  const assignBag = useAssignBag(id);
  const unassignBag = useUnassignBag(id);

  const assignedBags = tripBags.map((tb: BagWithItems) => ({
    id: tb.id,
    name: tb.name,
    type: tb.type,
  }));
  const bagItemsMap: Record<number, Item[]> = {};
  tripBags.forEach((tb: BagWithItems) => {
    bagItemsMap[tb.id] = tb.items ?? [];
  });
  const unassignedBags = allBags.filter(
    (b: Bag) => !assignedBags.find((a: { id: number }) => a.id === b.id),
  );

  const editForm = useTripEditForm(trip, updateTrip);
  const destForm = useDestinationForm(addDest, updateDest);
  const bagForm = useBagAssignment(unassignedBags, assignBag);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmTrip, setConfirmTrip] = useState(false);
  const [confirmDestId, setConfirmDestId] = useState<number | null>(null);
  const [confirmBagId, setConfirmBagId] = useState<number | null>(null);
  const [expandedBags, setExpandedBags] = useState<Set<number>>(new Set());
  const [createBagOpen, setCreateBagOpen] = useState(false);

  if (isLoading)
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
  if (!trip)
    return (
      <p
        style={{
          color: "var(--destructive)",
          textAlign: "center",
          paddingTop: "48px",
        }}
      >
        Trip not found.
      </p>
    );

  return (
    <>
      {/* Trip header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
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
            {trip.is_active && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: "99px",
                  background: "rgba(74,123,181,0.1)",
                  color: "var(--primary)",
                }}
              >
                Active
              </span>
            )}
          </div>
          {(trip.start_date || trip.end_date) && (
            <p
              style={{ fontSize: "12px", color: "var(--fg-muted)", margin: 0 }}
            >
              {trip.start_date ?? "—"} → {trip.end_date ?? "—"}
            </p>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "5px 10px",
              fontSize: "18px",
              color: "var(--fg-secondary)",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 10 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "36px",
                  zIndex: 20,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  boxShadow: "var(--shadow-md)",
                  minWidth: "140px",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    toggleActive.mutate(trip.is_active);
                    setMenuOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontSize: "13px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--primary)",
                  }}
                >
                  {trip.is_active ? "Deactivate" : "Active"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editForm.openEdit();
                    setMenuOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontSize: "13px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--foreground)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmTrip(true);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontSize: "13px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--destructive)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Destinations */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h3 style={sectionHeader}>Destinations</h3>
          <button
            type="button"
            style={{
              ...btnPrimary,
              fontSize: "13px",
              padding: "5px 12px",
              height: "auto",
            }}
            onClick={destForm.openAdd}
          >
            + Add
          </button>
        </div>
        {destLoading ? (
          <p style={{ color: "var(--fg-muted)", fontSize: "14px" }}>Loading…</p>
        ) : destinations.length === 0 ? (
          <p style={{ color: "var(--fg-muted)", fontSize: "14px" }}>
            No destinations yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {destinations.map((dest: Destination) => (
              <div key={dest.id} style={rowStyle}>
                <div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--foreground)",
                    }}
                  >
                    {dest.city}, {dest.country}
                  </span>
                  {(dest.arrival_date || dest.departure_date) && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--fg-muted)",
                        margin: "2px 0 0",
                      }}
                    >
                      {dest.arrival_date ?? "—"} → {dest.departure_date ?? "—"}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => destForm.openEdit(dest)}
                    title="Edit"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--fg-muted)",
                      fontSize: "13px",
                      padding: "4px 8px",
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDestId(dest.id)}
                    title="Remove"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--fg-muted)",
                      fontSize: "16px",
                      lineHeight: 1,
                      padding: "4px 6px",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bags */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "24px",
          marginTop: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h3 style={sectionHeader}>Bags</h3>
          <div style={{ display: "flex", gap: "6px" }}>
            {unassignedBags.length > 0 && (
              <button
                type="button"
                style={{
                  ...btnPrimary,
                  background: "transparent",
                  color: "var(--primary)",
                  border: "1px solid var(--primary)",
                  fontSize: "13px",
                  padding: "5px 12px",
                  height: "auto",
                }}
                onClick={bagForm.openModal}
              >
                Assign
              </button>
            )}
            <button
              type="button"
              style={{
                ...btnPrimary,
                fontSize: "13px",
                padding: "5px 12px",
                height: "auto",
              }}
              onClick={() => setCreateBagOpen(true)}
            >
              + New bag
            </button>
          </div>
        </div>
        {assignedBags.length === 0 ? (
          <p style={{ color: "var(--fg-muted)", fontSize: "14px" }}>
            Bags assigned to this trip appear here.
            {allBags.length === 0 && " Create bags first from the Bags page."}
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {assignedBags.map(
              (bag: { id: number; name: string; type: string }) => {
                const expanded = expandedBags.has(bag.id);
                const items = bagItemsMap[bag.id] ?? [];
                return (
                  <div
                    key={bag.id}
                    style={{
                      background: "var(--bg-surface)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          flex: 1,
                          textAlign: "left",
                        }}
                        onClick={() =>
                          setExpandedBags((prev) => {
                            const next = new Set(prev);
                            next.has(bag.id)
                              ? next.delete(bag.id)
                              : next.add(bag.id);
                            return next;
                          })
                        }
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            color: "var(--fg-muted)",
                            lineHeight: 1,
                            transition: "transform 120ms",
                            display: "inline-block",
                            transform: expanded
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          ▶
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--foreground)",
                          }}
                        >
                          {bag.name}
                        </span>
                        <TypeBadge type={bag.type} />
                        {(() => {
                          let total = 0,
                            packed = 0;
                          for (const i of items) {
                            if (i.sub_items?.length) {
                              for (const s of i.sub_items) {
                                total += s.quantity || 1;
                                if (s.packed) packed += s.quantity || 1;
                              }
                            } else {
                              total += i.quantity || 1;
                              if (i.packed) packed += i.quantity || 1;
                            }
                          }
                          return (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--fg-muted)",
                              }}
                            >
                              {packed}/{total} packed
                            </span>
                          );
                        })()}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmBagId(bag.id)}
                        title="Remove bag"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--fg-muted)",
                          fontSize: "16px",
                          lineHeight: 1,
                          padding: "4px 6px",
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {expanded && (
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          padding: "12px 16px",
                        }}
                      >
                        <BagItemsTable
                          bagId={bag.id}
                          initialItems={items}
                          categories={categories as Category[]}
                          onItemsChange={(updated) => {
                            qc.setQueryData(
                              keys.tripBags(id),
                              (old: BagWithItems[] | undefined) =>
                                old?.map((tb: BagWithItems) =>
                                  tb.id === bag.id
                                    ? { ...tb, items: updated }
                                    : tb,
                                ),
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* Edit trip modal */}
      <Dialog open={editForm.open} onClose={() => editForm.setOpen(false)}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            Edit trip
          </h2>
          <button
            type="button"
            onClick={() => editForm.setOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              fontSize: "18px",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={editForm.form.handleSubmit(editForm.handleSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label htmlFor="trip-name" style={labelStyle}>
              Name
            </label>
            <input
              id="trip-name"
              type="text"
              autoFocus
              {...editForm.form.register("name")}
              style={inputStyle(!!editForm.form.formState.errors.name)}
              onFocus={(e) =>
                (e.target.style.boxShadow = "var(--shadow-focus)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {editForm.form.formState.errors.name && (
              <p style={errorStyle}>
                {editForm.form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label htmlFor="trip-start_date" style={labelStyle}>
                Start date
              </label>
              <input
                id="trip-start_date"
                type="date"
                {...editForm.form.register("start_date")}
                style={inputStyle(false)}
                onFocus={(e) =>
                  (e.target.style.boxShadow = "var(--shadow-focus)")
                }
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>
            <div>
              <label htmlFor="trip-end_date" style={labelStyle}>
                End date
              </label>
              <input
                id="trip-end_date"
                type="date"
                {...editForm.form.register("end_date")}
                style={inputStyle(false)}
                onFocus={(e) =>
                  (e.target.style.boxShadow = "var(--shadow-focus)")
                }
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>
          </div>
          {editForm.error && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--destructive)",
                textAlign: "center",
              }}
            >
              {editForm.error}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => editForm.setOpen(false)}
              style={{
                flex: 1,
                height: "42px",
                background: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editForm.isPending}
              style={{
                ...submitBtnStyle(editForm.isPending),
                flex: 1,
                marginTop: 0,
              }}
            >
              {editForm.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Add/edit destination modal */}
      <Dialog open={destForm.open} onClose={destForm.close}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            {destForm.editing ? "Edit destination" : "Add destination"}
          </h2>
          <button
            type="button"
            onClick={destForm.close}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              fontSize: "18px",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={destForm.form.handleSubmit(destForm.handleSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label htmlFor="dest-city" style={labelStyle}>
              City
            </label>
            <input
              id="dest-city"
              type="text"
              placeholder="e.g. Paris"
              autoFocus
              {...destForm.form.register("city")}
              style={inputStyle(!!destForm.form.formState.errors.city)}
              onFocus={(e) =>
                (e.target.style.boxShadow = "var(--shadow-focus)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {destForm.form.formState.errors.city && (
              <p style={errorStyle}>
                {destForm.form.formState.errors.city.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="dest-country" style={labelStyle}>
              Country
            </label>
            <input
              id="dest-country"
              type="text"
              placeholder="e.g. France"
              {...destForm.form.register("country")}
              style={inputStyle(!!destForm.form.formState.errors.country)}
              onFocus={(e) =>
                (e.target.style.boxShadow = "var(--shadow-focus)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {destForm.form.formState.errors.country && (
              <p style={errorStyle}>
                {destForm.form.formState.errors.country.message}
              </p>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label htmlFor="dest-arrival_date" style={labelStyle}>
                Arrival
              </label>
              <input
                id="dest-arrival_date"
                type="date"
                {...destForm.form.register("arrival_date")}
                style={inputStyle(false)}
                onFocus={(e) =>
                  (e.target.style.boxShadow = "var(--shadow-focus)")
                }
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>
            <div>
              <label htmlFor="dest-departure_date" style={labelStyle}>
                Departure
              </label>
              <input
                id="dest-departure_date"
                type="date"
                {...destForm.form.register("departure_date")}
                style={inputStyle(false)}
                onFocus={(e) =>
                  (e.target.style.boxShadow = "var(--shadow-focus)")
                }
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>
          </div>
          {destForm.error && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--destructive)",
                textAlign: "center",
              }}
            >
              {destForm.error}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={destForm.close}
              style={{
                flex: 1,
                height: "42px",
                background: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={destForm.isPending}
              style={{
                ...submitBtnStyle(destForm.isPending),
                flex: 1,
                marginTop: 0,
              }}
            >
              {destForm.isPending
                ? "Saving…"
                : destForm.editing
                  ? "Save"
                  : "Add"}
            </button>
          </div>
        </form>
      </Dialog>

      <CreateBagModal
        open={createBagOpen}
        onClose={() => setCreateBagOpen(false)}
        onCreated={async (bag) => {
          await bagForm.handleBagCreated(bag);
          setCreateBagOpen(false);
        }}
      />

      {/* Assign bag modal */}
      <Dialog open={bagForm.open} onClose={() => bagForm.setOpen(false)}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            Assign bag
          </h2>
          <button
            type="button"
            onClick={() => bagForm.setOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              fontSize: "18px",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="assign-bag" style={labelStyle}>
              Bag
            </label>
            <select
              id="assign-bag"
              value={bagForm.selectedId}
              onChange={(e) => bagForm.setSelectedId(e.target.value)}
              style={{ ...inputStyle(false), cursor: "pointer" }}
            >
              {unassignedBags.map((b: Bag) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name} ({b.type})
                </option>
              ))}
            </select>
          </div>
          {bagForm.err && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--destructive)",
                textAlign: "center",
              }}
            >
              {bagForm.err}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => bagForm.setOpen(false)}
              style={{
                flex: 1,
                height: "42px",
                background: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={bagForm.handleAssign}
              disabled={bagForm.isPending}
              style={{
                ...submitBtnStyle(bagForm.isPending),
                flex: 1,
                marginTop: 0,
              }}
            >
              {bagForm.isPending ? "Assigning…" : "Assign"}
            </button>
          </div>
        </div>
      </Dialog>

      <ConfirmModal
        open={confirmTrip}
        title="Delete trip?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          await deleteTrip.mutateAsync();
          router.replace("/");
        }}
        onCancel={() => setConfirmTrip(false)}
      />
      <ConfirmModal
        open={confirmDestId !== null}
        title="Remove destination?"
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirmDestId !== null) deleteDest.mutate(confirmDestId);
          setConfirmDestId(null);
        }}
        onCancel={() => setConfirmDestId(null)}
      />
      <ConfirmModal
        open={confirmBagId !== null}
        title="Remove bag from trip?"
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirmBagId !== null) unassignBag.mutate(confirmBagId);
          setConfirmBagId(null);
        }}
        onCancel={() => setConfirmBagId(null)}
      />
    </>
  );
}
