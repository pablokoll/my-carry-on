"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BagItemsTable, type Category } from "@/components/bag-items-table";
import { Dialog } from "@/components/ui/dialog";
import { BAG_TYPES } from "@/lib/constants";
import { useBagDetail, useCategories, useUpdateBag } from "@/lib/queries";
import {
  errorStyle,
  inputStyle,
  labelStyle,
  submitBtnStyle,
} from "@/lib/styles";

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or less"),
  type: z.enum(BAG_TYPES),
});

type FormData = z.infer<typeof schema>;

export default function BagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const _router = useRouter();

  const { data: bagData, isLoading } = useBagDetail(id);
  const { data: categories = [] } = useCategories();
  const updateBag = useUpdateBag(id);

  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function openEdit() {
    if (!bagData) return;
    reset({ name: bagData.name, type: bagData.type as FormData["type"] });
    setError(null);
    setEditOpen(true);
  }

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await updateBag.mutateAsync(data);
      setEditOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update bag");
    }
  }

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
  if (!bagData)
    return (
      <p
        style={{
          color: "var(--destructive)",
          textAlign: "center",
          paddingTop: "48px",
        }}
      >
        Bag not found.
      </p>
    );

  return (
    <>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--foreground)",
              margin: "0 0 4px",
            }}
          >
            {bagData.name}
          </h2>
          <span
            style={{
              background: "rgba(74,123,181,0.1)",
              color: "var(--primary)",
              borderRadius: "999px",
              padding: "2px 10px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {bagData.type}
          </span>
        </div>
        <button
          type="button"
          onClick={openEdit}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "6px 14px",
            fontSize: "13px",
            color: "var(--fg-secondary)",
            cursor: "pointer",
          }}
        >
          Edit bag
        </button>
      </div>

      <BagItemsTable
        bagId={bagData.id}
        initialItems={bagData.items ?? []}
        categories={categories as Category[]}
        showPacked={false}
      />

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
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
            Edit bag
          </h2>
          <button
            type="button"
            onClick={() => setEditOpen(false)}
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
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label htmlFor="name" style={labelStyle}>
              Name
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              {...register("name")}
              style={inputStyle(!!errors.name)}
              onFocus={(e) =>
                (e.target.style.boxShadow = "var(--shadow-focus)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="type" style={labelStyle}>
              Type
            </label>
            <select
              id="type"
              {...register("type")}
              style={{ ...inputStyle(false), cursor: "pointer" }}
            >
              {BAG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--destructive)",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
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
              disabled={isSubmitting}
              style={{ ...submitBtnStyle(isSubmitting), flex: 1, marginTop: 0 }}
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
