'use client'

import { btnPrimary } from '@/lib/styles'
import { useBagItems } from './use-bag-items'
import { ItemTableView } from './item-table-view'
import { ItemTableEdit } from './item-table-edit'
import type { Category, Item } from './types'

export type { Category, Item }
export { catColor } from './constants'

interface BagItemsTableProps {
  bagId: number
  initialItems: Item[]
  categories: Category[]
  onItemsChange?: (items: Item[]) => void
  showPacked?: boolean
}

export function BagItemsTable({ bagId, initialItems, categories, onItemsChange, showPacked = true }: BagItemsTableProps) {
  const state = useBagItems({ bagId, initialItems, categories, onItemsChange })
  const isEmpty = state.serverItems.length === 0 && !state.editMode

  if (isEmpty) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-muted)', fontSize: '14px', marginBottom: '12px' }}>No items yet.</p>
        <button style={{ ...btnPrimary, height: '34px', fontSize: '13px' }} onClick={state.enterEdit}>Add items</button>
      </div>
    )
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
    )
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
  )
}
