"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { BAG_TYPES } from "@/lib/constants";
import { type Bag, useCreateBag } from "@/lib/queries";
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
          New bag
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
          <label htmlFor="bag-name" style={labelStyle}>
            Name
          </label>
          <input
            id="bag-name"
            type="text"
            placeholder="e.g. Main carry-on"
            autoFocus
            {...register("name")}
            style={inputStyle(!!errors.name)}
            onFocus={(e) => (e.target.style.boxShadow = "var(--shadow-focus)")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />
          {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="bag-type" style={labelStyle}>
            Type
          </label>
          <select
            id="bag-type"
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
            {isSubmitting ? "Creating…" : "Create bag"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
