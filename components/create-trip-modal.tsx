"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { useCreateTrip } from "@/lib/queries";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTripModal({ open, onClose, onCreated }: Props) {
  const [error, setError] = useState<string | null>(null);
  const createTrip = useCreateTrip();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await createTrip.mutateAsync(data);
      onCreated();
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create trip");
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
          New trip
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
            htmlFor="trip-name"
            className="block text-[13px] font-medium text-foreground mb-1.5"
          >
            Trip name
          </label>
          <input
            type="text"
            id="trip-name"
            placeholder="e.g. Summer in Italy"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="start_date"
              className="block text-[13px] font-medium text-foreground mb-1.5"
            >
              Start date
            </label>
            <input
              id="start_date"
              type="date"
              {...register("start_date")}
              className="field-input"
            />
          </div>
          <div>
            <label
              htmlFor="end_date"
              className="block text-[13px] font-medium text-foreground mb-1.5"
            >
              End date
            </label>
            <input
              id="end_date"
              type="date"
              {...register("end_date")}
              className="field-input"
            />
          </div>
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
            {isSubmitting ? "Creating…" : "Create trip"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
