"use client";

import Link from "next/link";
import { useState } from "react";
import { CreateBagModal } from "@/components/create-bag-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { TypeBadge } from "@/components/ui/type-badge";
import type { Bag } from "@/lib/queries";
import { useAllBags, useDeleteBag, useDuplicateBag } from "@/lib/queries";
import { btnDestructive, btnPrimary } from "@/lib/styles";

export default function BagsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: bags = [], isLoading } = useAllBags();
  const deleteBag = useDeleteBag();
  const duplicateBag = useDuplicateBag();

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

  return (
    <>
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
            fontSize: "20px",
            fontWeight: 600,
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          Bags
        </h2>
        <button
          type="button"
          style={btnPrimary}
          onClick={() => setModalOpen(true)}
        >
          New bag
        </button>
      </div>

      {bags.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: "64px" }}>
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "15px",
              marginBottom: "20px",
            }}
          >
            No bags yet.
          </p>
          <button
            type="button"
            style={btnPrimary}
            onClick={() => setModalOpen(true)}
          >
            Prepare your first bag
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {bags.map((bag: Bag) => (
            <div key={bag.id} style={{ position: "relative" }}>
              <Link
                href={`/bags/${bag.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--bg-surface)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  paddingRight: "140px",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    marginRight: "10px",
                  }}
                >
                  {bag.name}
                </span>
                <TypeBadge type={bag.type} />
              </Link>
              <div
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  gap: "4px",
                }}
              >
                <button
                  type="button"
                  style={{ ...btnDestructive, color: "var(--fg-muted)" }}
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
                  style={btnDestructive}
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
