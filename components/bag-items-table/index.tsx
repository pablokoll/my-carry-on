"use client";

import { ItemTableEdit } from "./item-table-edit";
import { ItemTableView } from "./item-table-view";
import type { Category, Item } from "./types";
import { useBagItems } from "./use-bag-items";

export { catColor } from "./constants";
export type { Category, Item };

interface BagItemsTableProps {
  bagId: number;
  initialItems: Item[];
  categories: Category[];
  onItemsChange?: (items: Item[]) => void;
  showPacked?: boolean;
}

export function BagItemsTable({
  bagId,
  initialItems,
  categories,
  onItemsChange,
  showPacked = true,
}: BagItemsTableProps) {
  const state = useBagItems({ bagId, initialItems, categories, onItemsChange });
  const isEmpty = state.serverItems.length === 0 && !state.editMode;

  if (isEmpty) {
    return (
      <div className="py-6 text-center">
        <p className="text-[color:var(--fg-muted)] text-sm mb-3">
          No items yet.
        </p>
        <button
          type="button"
          className="btn-primary h-[34px] text-[13px]"
          onClick={state.enterEdit}
        >
          Add items
        </button>
      </div>
    );
  }

  if (state.editMode) {
    return (
      <ItemTableEdit
        drafts={state.drafts}
        subDrafts={state.subDrafts}
        categories={categories}
        nameErrors={state.nameErrors}
        subNameErrors={state.subNameErrors}
        saving={state.saving}
        saveErr={state.saveErr}
        expandedItems={state.expandedItems}
        firstInputRef={state.firstInputRef}
        getSubDraftsForItem={state.getSubDraftsForItem}
        updateDraft={state.updateDraft}
        removeRow={state.removeRow}
        addRow={state.addRow}
        addSubRow={state.addSubRow}
        updateSubDraft={state.updateSubDraft}
        removeSubRow={state.removeSubRow}
        toggleExpand={state.toggleExpand}
        cancelEdit={state.cancelEdit}
        handleSave={state.handleSave}
      />
    );
  }

  return (
    <ItemTableView
      table={state.table}
      categories={categories}
      grouping={state.grouping}
      columnFilters={state.columnFilters}
      expandedItems={state.expandedItems}
      showPacked={showPacked}
      serverItems={state.serverItems}
      setColumnFilters={state.setColumnFilters}
      setGrouping={state.setGrouping}
      enterEdit={state.enterEdit}
      toggleExpand={state.toggleExpand}
      togglePacked={state.togglePacked}
      toggleSubPacked={state.toggleSubPacked}
    />
  );
}
