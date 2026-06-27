"use client";

import { flexRender, type Table } from "@tanstack/react-table";
import React from "react";
import { catColor, cellInner, th } from "./constants";
import type { Category, Item, SubItem } from "./types";

interface ItemTableViewProps {
  table: Table<Item>;
  categories: Category[];
  grouping: string[];
  columnFilters: { id: string; value: unknown }[];
  expandedItems: Set<number>;
  showPacked: boolean;
  serverItems: Item[];
  setColumnFilters: (filters: { id: string; value: unknown }[]) => void;
  setGrouping: (fn: (g: string[]) => string[]) => void;
  enterEdit: () => void;
  toggleExpand: (itemId: number) => void;
  togglePacked: (item: Item) => void;
  toggleSubPacked: (itemId: number, sub: SubItem) => void;
}

export function ItemTableView({
  table,
  categories,
  grouping,
  columnFilters,
  expandedItems,
  showPacked,
  serverItems,
  setColumnFilters,
  setGrouping,
  enterEdit,
  toggleExpand,
  togglePacked,
  toggleSubPacked,
}: ItemTableViewProps) {
  const isGrouped = grouping.length > 0;
  const filterCatId =
    (columnFilters.find((f) => f.id === "category")?.value as number | "all") ??
    "all";

  function renderItem(item: Item, catName: string | null) {
    const color = catColor(item.category_id);
    const expandedSubs = expandedItems.has(item.id);
    const hasSubs = item.sub_items.length > 0;

    return (
      <React.Fragment key={item.id}>
        <tr
          onClick={hasSubs ? () => toggleExpand(item.id) : undefined}
          style={{
            background: color?.bg ?? "transparent",
            opacity: showPacked && item.packed ? 0.55 : 1,
            transition: "opacity 180ms",
            cursor: hasSubs ? "pointer" : "default",
          }}
        >
          <td className="p-0 text-center align-middle">
            {hasSubs ? (
              <button
                type="button"
                className="bg-transparent border-none cursor-pointer text-[color:var(--fg-muted)] text-[10px] px-2 leading-none transition-transform duration-[120ms]"
                style={{ transform: expandedSubs ? "rotate(90deg)" : "none" }}
              >
                ▶
              </button>
            ) : showPacked ? (
              <input
                type="checkbox"
                checked={item.packed}
                onChange={() => togglePacked(item)}
                onClick={(e) => e.stopPropagation()}
                className="w-[15px] h-[15px] cursor-pointer accent-primary"
              />
            ) : null}
          </td>
          <td className="p-0 align-middle">
            <div
              style={{
                ...cellInner,
                textDecoration:
                  showPacked && item.packed ? "line-through" : "none",
              }}
            >
              {item.name}
            </div>
          </td>
          <td className="p-0 text-center align-middle">
            <div
              style={{
                ...cellInner,
                color:
                  item.quantity > 1 ? "var(--foreground)" : "var(--fg-muted)",
              }}
            >
              {item.quantity}
            </div>
          </td>
          <td className="p-0 align-middle">
            {color && catName ? (
              <div
                style={{
                  ...cellInner,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: color.dot }}
                />
                <span className="text-[13px] text-[color:var(--fg-secondary)]">
                  {catName}
                </span>
              </div>
            ) : (
              <div
                style={{
                  ...cellInner,
                  color: "var(--fg-muted)",
                  fontSize: "13px",
                }}
              >
                —
              </div>
            )}
          </td>
        </tr>
        {hasSubs &&
          expandedSubs &&
          item.sub_items.map((sub) => (
            <tr
              key={`sub-${sub.id}`}
              style={{
                background: color ? color.bg : "transparent",
                opacity: showPacked && sub.packed ? 0.5 : 0.85,
              }}
            >
              <td className="p-0 text-center align-middle">
                {showPacked && (
                  <input
                    type="checkbox"
                    checked={sub.packed}
                    onChange={() => toggleSubPacked(item.id, sub)}
                    className="w-[13px] h-[13px] cursor-pointer accent-primary"
                  />
                )}
              </td>
              <td className="p-0 align-middle">
                <div
                  style={{
                    ...cellInner,
                    fontSize: "12px",
                    paddingLeft: "24px",
                    textDecoration:
                      showPacked && sub.packed ? "line-through" : "none",
                    color: "var(--fg-secondary)",
                  }}
                >
                  {sub.name}
                </div>
              </td>
              <td className="p-0 text-center align-middle">
                <div
                  style={{
                    ...cellInner,
                    fontSize: "12px",
                    color:
                      sub.quantity > 1
                        ? "var(--foreground)"
                        : "var(--fg-muted)",
                  }}
                >
                  {sub.quantity}
                </div>
              </td>
              <td />
            </tr>
          ))}
      </React.Fragment>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={filterCatId === "all" ? "all" : String(filterCatId)}
            onChange={(e) =>
              setColumnFilters(
                e.target.value === "all"
                  ? []
                  : [{ id: "category", value: Number(e.target.value) }],
              )
            }
            className="cat-select w-auto min-w-[100px] h-[26px] text-[11px] px-1.5"
          >
            <option value="all">All</option>
            {categories
              .filter((c) => serverItems.some((i) => i.category_id === c.id))
              .map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="btn-secondary text-[11px] h-[26px] px-2"
            onClick={() =>
              setGrouping((g) => (g.length > 0 ? [] : ["category"]))
            }
          >
            {isGrouped ? "Ungroup" : "Group"}
          </button>
        </div>
        <button
          type="button"
          className="btn-primary h-[26px] px-2.5 text-xs"
          onClick={enterEdit}
        >
          Edit
        </button>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: "36px" }} />
            <col />
            <col style={{ width: "52px" }} />
            <col style={{ width: "110px" }} />
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{
                        ...th,
                        cursor: canSort ? "pointer" : "default",
                        textAlign: header.id === "quantity" ? "center" : "left",
                      }}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {canSort &&
                        (sorted === "asc"
                          ? " ↑"
                          : sorted === "desc"
                            ? " ↓"
                            : " ↕")}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                const catName = row.getValue<string>("category");
                const catId =
                  categories.find((c) => c.name === catName)?.id ?? null;
                const color = catColor(catId);
                return (
                  <React.Fragment key={row.id}>
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: "10px 12px 4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: color?.dot ?? "var(--fg-muted)",
                          borderBottom: `1px solid ${color ? `${color.dot}30` : "var(--border)"}`,
                        }}
                      >
                        {color && (
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                            style={{ background: color.dot }}
                          />
                        )}
                        {catName}
                      </td>
                    </tr>
                    {row.subRows.map((subRow) =>
                      renderItem(
                        subRow.original,
                        catName !== "Uncategorized" ? catName : null,
                      ),
                    )}
                  </React.Fragment>
                );
              }
              return renderItem(
                row.original,
                categories.find((c) => c.id === row.original.category_id)
                  ?.name ?? null,
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
