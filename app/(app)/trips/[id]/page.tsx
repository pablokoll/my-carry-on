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
      <p className="text-[color:var(--fg-muted)] text-sm text-center pt-12">
        Loading…
      </p>
    );
  if (!trip)
    return (
      <p className="text-destructive text-center pt-12">Trip not found.</p>
    );

  return (
    <>
      {/* Trip header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-foreground m-0">
              {trip.name}
            </h2>
            {trip.is_active && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[rgba(74,123,181,0.1)] text-primary">
                Active
              </span>
            )}
          </div>
          {(trip.start_date || trip.end_date) && (
            <p className="text-xs text-[color:var(--fg-muted)] m-0">
              {trip.start_date ?? "—"} → {trip.end_date ?? "—"}
            </p>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="bg-transparent border border-border rounded-lg px-2.5 py-[5px] text-lg text-[color:var(--fg-secondary)] cursor-pointer leading-none hover:bg-[var(--bg-surface)] transition-[background] duration-[120ms]"
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-10 border-none bg-transparent p-0 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-9 z-20 bg-card border border-border rounded-[10px] shadow-[var(--shadow-md-val)] min-w-[140px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    toggleActive.mutate(trip.is_active);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-[13px] bg-transparent border-none cursor-pointer text-primary hover:bg-[var(--bg-surface)] transition-[background] duration-[120ms]"
                >
                  {trip.is_active ? "Deactivate" : "Active"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editForm.openEdit();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-[13px] bg-transparent border-t border-border cursor-pointer text-foreground hover:bg-[var(--bg-surface)] transition-[background] duration-[120ms]"
                  style={{
                    border: "none",
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
                  className="block w-full text-left px-4 py-2.5 text-[13px] bg-transparent cursor-pointer text-destructive hover:bg-[rgba(232,48,74,0.07)] transition-[background] duration-[120ms]"
                  style={{
                    border: "none",
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground m-0">
            Destinations
          </h3>
          <button
            type="button"
            className="btn-primary text-[13px] px-3 py-[5px] h-auto"
            onClick={destForm.openAdd}
          >
            + Add
          </button>
        </div>
        {destLoading ? (
          <p className="text-[color:var(--fg-muted)] text-sm">Loading…</p>
        ) : destinations.length === 0 ? (
          <p className="text-[color:var(--fg-muted)] text-sm">
            No destinations yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {destinations.map((dest: Destination) => (
              <div
                key={dest.id}
                className="bg-[var(--bg-surface)] rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {dest.city}, {dest.country}
                  </span>
                  {(dest.arrival_date || dest.departure_date) && (
                    <p className="text-xs text-[color:var(--fg-muted)] mt-0.5 mb-0">
                      {dest.arrival_date ?? "—"} → {dest.departure_date ?? "—"}
                    </p>
                  )}
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => destForm.openEdit(dest)}
                    title="Edit"
                    className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-[13px] px-2 py-1 hover:text-foreground transition-colors duration-[120ms]"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDestId(dest.id)}
                    title="Remove"
                    className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-base leading-none px-1.5 py-1 hover:text-destructive transition-colors duration-[120ms]"
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
      <div className="border-t border-border pt-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground m-0">Bags</h3>
          <div className="flex gap-1.5">
            {unassignedBags.length > 0 && (
              <button
                type="button"
                className="btn-primary bg-transparent text-primary border border-primary text-[13px] px-3 py-[5px] h-auto hover:bg-[rgba(74,123,181,0.08)]"
                onClick={bagForm.openModal}
              >
                Assign
              </button>
            )}
            <button
              type="button"
              className="btn-primary text-[13px] px-3 py-[5px] h-auto"
              onClick={() => setCreateBagOpen(true)}
            >
              + New bag
            </button>
          </div>
        </div>
        {assignedBags.length === 0 ? (
          <p className="text-[color:var(--fg-muted)] text-sm">
            Bags assigned to this trip appear here.
            {allBags.length === 0 && " Create bags first from the Bags page."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {assignedBags.map(
              (bag: { id: number; name: string; type: string }) => {
                const expanded = expandedBags.has(bag.id);
                const items = bagItemsMap[bag.id] ?? [];
                return (
                  <div
                    key={bag.id}
                    className="bg-[var(--bg-surface)] rounded-[10px] overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <button
                        type="button"
                        className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0 flex-1 text-left"
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
                          className="text-[13px] text-[color:var(--fg-muted)] leading-none inline-block transition-transform duration-[120ms]"
                          style={{
                            transform: expanded
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          ▶
                        </span>
                        <span className="text-sm font-semibold text-foreground">
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
                            <span className="text-xs text-[color:var(--fg-muted)]">
                              {packed}/{total} packed
                            </span>
                          );
                        })()}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmBagId(bag.id)}
                        title="Remove bag"
                        className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-base leading-none px-1.5 py-1 shrink-0 hover:text-destructive transition-colors duration-[120ms]"
                      >
                        ×
                      </button>
                    </div>
                    {expanded && (
                      <div className="border-t border-border px-4 py-3">
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-semibold text-foreground m-0">
            Edit trip
          </h2>
          <button
            type="button"
            onClick={() => editForm.setOpen(false)}
            className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-lg leading-none p-1 hover:text-foreground transition-colors duration-[120ms]"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={editForm.form.handleSubmit(editForm.handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="trip-name"
              className="block text-[13px] font-medium text-foreground mb-1.5"
            >
              Name
            </label>
            <input
              id="trip-name"
              type="text"
              autoFocus
              {...editForm.form.register("name")}
              className={`field-input${editForm.form.formState.errors.name ? " is-error" : ""}`}
            />
            {editForm.form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">
                {editForm.form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="trip-start_date"
                className="block text-[13px] font-medium text-foreground mb-1.5"
              >
                Start date
              </label>
              <input
                id="trip-start_date"
                type="date"
                {...editForm.form.register("start_date")}
                className="field-input"
              />
            </div>
            <div>
              <label
                htmlFor="trip-end_date"
                className="block text-[13px] font-medium text-foreground mb-1.5"
              >
                End date
              </label>
              <input
                id="trip-end_date"
                type="date"
                {...editForm.form.register("end_date")}
                className="field-input"
              />
            </div>
          </div>
          {editForm.error && (
            <p className="text-[13px] text-destructive text-center">
              {editForm.error}
            </p>
          )}
          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={() => editForm.setOpen(false)}
              className="flex-1 h-[42px] bg-transparent text-foreground border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--bg-surface)] transition-[background] duration-[180ms]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editForm.isPending}
              className="btn-submit flex-1 mt-0"
            >
              {editForm.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Add/edit destination modal */}
      <Dialog open={destForm.open} onClose={destForm.close}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-semibold text-foreground m-0">
            {destForm.editing ? "Edit destination" : "Add destination"}
          </h2>
          <button
            type="button"
            onClick={destForm.close}
            className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-lg leading-none p-1 hover:text-foreground transition-colors duration-[120ms]"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={destForm.form.handleSubmit(destForm.handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="dest-city"
              className="block text-[13px] font-medium text-foreground mb-1.5"
            >
              City
            </label>
            <input
              id="dest-city"
              type="text"
              placeholder="e.g. Paris"
              autoFocus
              {...destForm.form.register("city")}
              className={`field-input${destForm.form.formState.errors.city ? " is-error" : ""}`}
            />
            {destForm.form.formState.errors.city && (
              <p className="text-xs text-destructive mt-1">
                {destForm.form.formState.errors.city.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="dest-country"
              className="block text-[13px] font-medium text-foreground mb-1.5"
            >
              Country
            </label>
            <input
              id="dest-country"
              type="text"
              placeholder="e.g. France"
              {...destForm.form.register("country")}
              className={`field-input${destForm.form.formState.errors.country ? " is-error" : ""}`}
            />
            {destForm.form.formState.errors.country && (
              <p className="text-xs text-destructive mt-1">
                {destForm.form.formState.errors.country.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="dest-arrival_date"
                className="block text-[13px] font-medium text-foreground mb-1.5"
              >
                Arrival
              </label>
              <input
                id="dest-arrival_date"
                type="date"
                {...destForm.form.register("arrival_date")}
                className="field-input"
              />
            </div>
            <div>
              <label
                htmlFor="dest-departure_date"
                className="block text-[13px] font-medium text-foreground mb-1.5"
              >
                Departure
              </label>
              <input
                id="dest-departure_date"
                type="date"
                {...destForm.form.register("departure_date")}
                className="field-input"
              />
            </div>
          </div>
          {destForm.error && (
            <p className="text-[13px] text-destructive text-center">
              {destForm.error}
            </p>
          )}
          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={destForm.close}
              className="flex-1 h-[42px] bg-transparent text-foreground border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--bg-surface)] transition-[background] duration-[180ms]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={destForm.isPending}
              className="btn-submit flex-1 mt-0"
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-semibold text-foreground m-0">
            Assign bag
          </h2>
          <button
            type="button"
            onClick={() => bagForm.setOpen(false)}
            className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-lg leading-none p-1 hover:text-foreground transition-colors duration-[120ms]"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="assign-bag"
              className="block text-[13px] font-medium text-foreground mb-1.5"
            >
              Bag
            </label>
            <select
              id="assign-bag"
              value={bagForm.selectedId}
              onChange={(e) => bagForm.setSelectedId(e.target.value)}
              className="field-input cursor-pointer"
            >
              {unassignedBags.map((b: Bag) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name} ({b.type})
                </option>
              ))}
            </select>
          </div>
          {bagForm.err && (
            <p className="text-[13px] text-destructive text-center">
              {bagForm.err}
            </p>
          )}
          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={() => bagForm.setOpen(false)}
              className="flex-1 h-[42px] bg-transparent text-foreground border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--bg-surface)] transition-[background] duration-[180ms]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={bagForm.handleAssign}
              disabled={bagForm.isPending}
              className="btn-submit flex-1 mt-0"
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
