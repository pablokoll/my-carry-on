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
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--foreground)",
          margin: "0 0 8px",
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--fg-muted)",
            margin: "0 0 20px",
          }}
        >
          {description}
        </p>
      )}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: description ? 0 : "20px",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            height: "40px",
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
          type="button"
          onClick={onConfirm}
          style={{
            flex: 1,
            height: "40px",
            background: "var(--destructive)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
