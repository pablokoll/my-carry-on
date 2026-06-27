"use client";

import { useState } from "react";
import { useCreateBag, type Bag } from "@/lib/queries";
import { FormModal, Field } from "@/components/ui/form-modal";
import { BAG_TYPES, type BagType } from "@/lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (bag: Bag) => void;
}

export function CreateBagModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<BagType>("carry-on");
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState("");
  const createBag = useCreateBag();

  function handleClose() {
    setName("");
    setType("carry-on");
    setNameError("");
    setFormError("");
    onClose();
  }

  async function handleCreate() {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");
    setFormError("");
    try {
      const bag = await createBag.mutateAsync({ name: name.trim(), type });
      onCreated(bag);
      handleClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create bag");
    }
  }

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="New bag"
      onSubmit={handleCreate}
      submitting={createBag.isPending}
      submitLabel="Create bag"
      error={formError}
    >
      <Field label="Name" error={nameError}>
        <input
          type="text"
          placeholder="e.g. Main carry-on"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
      </Field>
      <Field label="Type">
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as BagType)
          }
          style={{ cursor: "pointer" }}
        >
          {BAG_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
    </FormModal>
  );
}
