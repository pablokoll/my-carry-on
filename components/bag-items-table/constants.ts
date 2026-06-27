import type { CSSProperties } from "react";

export const COLORS = [
  { bg: "rgba(74,123,181,0.08)", dot: "#4a7bb5" },
  { bg: "rgba(94,164,110,0.10)", dot: "#5ea46e" },
  { bg: "rgba(198,120,60,0.10)", dot: "#c6783c" },
  { bg: "rgba(155,89,182,0.10)", dot: "#9b59b6" },
  { bg: "rgba(231,76,60,0.10)", dot: "#e74c3c" },
  { bg: "rgba(22,160,133,0.10)", dot: "#16a085" },
  { bg: "rgba(241,196,15,0.12)", dot: "#c8a000" },
  { bg: "rgba(52,73,94,0.08)", dot: "#34495e" },
];

export function catColor(categoryId: number | null) {
  if (categoryId === null) return null;
  return COLORS[categoryId % COLORS.length];
}

let _tempId = -1;
export function nextTempId() {
  return _tempId--;
}

export const th: CSSProperties = {
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--fg-muted)",
  textAlign: "left",
  borderBottom: "1px solid var(--border)",
  userSelect: "none",
  whiteSpace: "nowrap",
};

export const td: CSSProperties = {
  padding: "0",
  verticalAlign: "middle",
};

export const cellInner: CSSProperties = {
  padding: "8px 12px",
  fontSize: "14px",
  color: "var(--foreground)",
};

export function cellInput(isError?: boolean): CSSProperties {
  return {
    width: "100%",
    height: "36px",
    padding: "0 10px",
    fontSize: "14px",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: "6px",
    color: "var(--foreground)",
    outline: "none",
    transition: "border-color 120ms, box-shadow 120ms",
    borderColor: isError ? "var(--destructive)" : "transparent",
  };
}

export const qtyInput: CSSProperties = {
  width: "64px",
  height: "36px",
  padding: "0 8px",
  fontSize: "14px",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: "6px",
  color: "var(--foreground)",
  outline: "none",
  textAlign: "center",
};
