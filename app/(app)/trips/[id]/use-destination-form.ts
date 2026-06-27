import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type {
  Destination,
  DestinationInput,
  UpdateDestinationVars,
} from "@/lib/queries";

const schema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  arrival_date: z.string().optional(),
  departure_date: z.string().optional(),
});

export type DestinationFormData = z.infer<typeof schema>;

interface AddMutation {
  mutateAsync: (data: DestinationInput) => Promise<unknown>;
  isPending: boolean;
}

interface UpdateMutation {
  mutateAsync: (args: UpdateDestinationVars) => Promise<unknown>;
  isPending: boolean;
}

export function useDestinationForm(
  addDest: AddMutation,
  updateDest: UpdateMutation,
) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DestinationFormData>({ resolver: zodResolver(schema) });

  function close() {
    setOpen(false);
    setEditing(null);
    setError(null);
    form.reset();
  }

  function openAdd() {
    setEditing(null);
    form.reset({ city: "", country: "", arrival_date: "", departure_date: "" });
    setError(null);
    setOpen(true);
  }

  function openEdit(dest: Destination) {
    setEditing(dest);
    form.reset({
      city: dest.city,
      country: dest.country,
      arrival_date: dest.arrival_date ?? "",
      departure_date: dest.departure_date ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(data: DestinationFormData) {
    setError(null);
    const payload: DestinationInput = {
      city: data.city,
      country: data.country,
      arrival_date: data.arrival_date || null,
      departure_date: data.departure_date || null,
    };
    try {
      if (editing) {
        await updateDest.mutateAsync({ destId: editing.id, data: payload });
      } else {
        await addDest.mutateAsync(payload);
      }
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save destination");
    }
  }

  return {
    open,
    editing,
    error,
    form,
    close,
    openAdd,
    openEdit,
    handleSubmit,
    isPending: addDest.isPending || updateDest.isPending,
  };
}
