"use client";

import { Dialog } from "./dialog";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <h2 className="text-base font-semibold text-foreground mt-0 mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-[13px] text-[color:var(--fg-muted)] mt-0 mb-5">
          {description}
        </p>
      )}
      <div className={`flex gap-2.5 ${description ? "" : "mt-5"}`}>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-10 bg-transparent text-foreground border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--bg-surface)] transition-[background] duration-[180ms]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 h-10 bg-destructive text-destructive-foreground border-none rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[180ms]"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
