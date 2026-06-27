"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { BAG_TYPES } from "@/lib/constants";
import { type Bag, useCreateBag } from "@/lib/queries";

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or less"),
  type: z.enum(BAG_TYPES),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (bag: Bag) => void;
}

export function CreateBagModal({ open, onClose, onCreated }: Props) {
  const [error, setError] = useState<string | null>(null);
  const createBag = useCreateBag();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "carry-on" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const bag = await createBag.mutateAsync(data);
      onCreated(bag);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create bag");
    }
  }

  function handleClose() {
    reset();
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[17px] font-semibold text-foreground m-0">
          New bag
        </h2>
        <button
          type="button"
          onClick={handleClose}
          className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-lg leading-none p-1 hover:text-foreground transition-colors duration-[120ms]"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="bag-name"
            className="block text-[13px] font-medium text-foreground mb-1.5"
          >
            Name
          </label>
          <input
            id="bag-name"
            type="text"
            placeholder="e.g. Main carry-on"
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
            htmlFor="bag-type"
            className="block text-[13px] font-medium text-foreground mb-1.5"
          >
            Type
          </label>
          <select
            id="bag-type"
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
            onClick={handleClose}
            className="flex-1 h-[42px] bg-transparent text-foreground border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--bg-surface)] transition-[background] duration-[180ms]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-submit flex-1 mt-0"
          >
            {isSubmitting ? "Creating…" : "Create bag"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
