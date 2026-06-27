"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  errorStyle,
  inputStyle,
  labelStyle,
  submitBtnStyle,
} from "@/app/(auth)/auth-layout";
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
          New trip
        </h2>
        <button
          type="button"
          onClick={handleClose}
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
          <label htmlFor="trip-name" style={labelStyle}>
            Trip name
          </label>
          <input
            type="text"
            id="trip-name"
            placeholder="e.g. Summer in Italy"
            autoFocus
            {...register("name")}
            style={inputStyle(!!errors.name)}
            onFocus={(e) => (e.target.style.boxShadow = "var(--shadow-focus)")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />
          {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label htmlFor="start_date" style={labelStyle}>
              Start date
            </label>
            <input
              id="start_date"
              type="date"
              {...register("start_date")}
              style={inputStyle(false)}
              onFocus={(e) =>
                (e.target.style.boxShadow = "var(--shadow-focus)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>
          <div>
            <label htmlFor="end_date" style={labelStyle}>
              End date
            </label>
            <input
              id="end_date"
              type="date"
              {...register("end_date")}
              style={inputStyle(false)}
              onFocus={(e) =>
                (e.target.style.boxShadow = "var(--shadow-focus)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>
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
            onClick={handleClose}
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
            {isSubmitting ? "Creating…" : "Create trip"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
