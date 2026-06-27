"use client";

import Link from "next/link";
import { useState } from "react";
import { CreateBagModal } from "@/components/create-bag-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { TypeBadge } from "@/components/ui/type-badge";
import type { Bag } from "@/lib/queries";
import { useAllBags, useDeleteBag, useDuplicateBag } from "@/lib/queries";

export default function BagsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: bags = [], isLoading } = useAllBags();
  const deleteBag = useDeleteBag();
  const duplicateBag = useDuplicateBag();

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
        <h2 className="text-xl font-semibold text-foreground m-0">Bags</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setModalOpen(true)}
        >
          New bag
        </button>
      </div>

      {bags.length === 0 ? (
        <div className="text-center pt-16">
          <p className="text-[color:var(--fg-muted)] text-[15px] mb-5">
            No bags yet.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setModalOpen(true)}
          >
            Prepare your first bag
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {bags.map((bag: Bag) => (
            <div key={bag.id} className="relative">
              <Link
                href={`/bags/${bag.id}`}
                className="flex items-center bg-[var(--bg-surface)] rounded-lg px-4 py-3 pr-[140px] no-underline"
              >
                <span className="text-sm font-medium text-foreground mr-2.5">
                  {bag.name}
                </span>
                <TypeBadge type={bag.type} />
              </Link>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  className="btn-ghost text-[color:var(--fg-muted)]"
                  disabled={
                    duplicateBag.isPending && duplicateBag.variables === bag.id
                  }
                  onClick={() => duplicateBag.mutate(bag.id)}
                >
                  {duplicateBag.isPending && duplicateBag.variables === bag.id
                    ? "…"
                    : "Duplicate"}
                </button>
                <button
                  type="button"
                  className="btn-destructive"
                  onClick={() => setConfirmId(bag.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateBagModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setModalOpen(false)}
      />

      <ConfirmModal
        open={confirmId !== null}
        title="Delete bag?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmId !== null) deleteBag.mutate(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
