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
      <p className="text-[color:var(--fg-muted)] text-sm text-center pt-12">
        Loading…
      </p>
    );
  if (!bagData)
    return <p className="text-destructive text-center pt-12">Bag not found.</p>;

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-foreground mt-0 mb-1">
            {bagData.name}
          </h2>
          <span className="bg-[rgba(74,123,181,0.1)] text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
            {bagData.type}
          </span>
        </div>
        <button
          type="button"
          onClick={openEdit}
          className="bg-transparent border border-border rounded-lg px-3.5 py-1.5 text-[13px] text-[color:var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-surface)] transition-[background] duration-[180ms]"
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-semibold text-foreground m-0">
            Edit bag
          </h2>
          <button
            type="button"
            onClick={() => setEditOpen(false)}
            className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-lg leading-none p-1 hover:text-foreground transition-colors duration-[120ms]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-[13px] font-medium text-foreground mb-1.5"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              {...register("name")}
              className={`field-input${errors.name ? " is-error" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-[13px] font-medium text-foreground mb-1.5"
            >
              Type
            </label>
            <select
              id="type"
              {...register("type")}
              className="field-input cursor-pointer"
            >
              {BAG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-[13px] text-destructive text-center">{error}</p>
          )}

          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex-1 h-[42px] bg-transparent text-foreground border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--bg-surface)] transition-[background] duration-[180ms]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-submit flex-1 mt-0"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
