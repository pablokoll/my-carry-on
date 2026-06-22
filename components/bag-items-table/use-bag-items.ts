import { useEffect, useRef, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type GroupingState,
  type ExpandedState,
} from '@tanstack/react-table'
import { api } from '@/lib/api'
import type { Category, Item, RowDraft, SubDraft, SubItem } from './types'
import { nextTempId } from './constants'

interface UseBagItemsProps {
  bagId: number
  initialItems: Item[]
  categories: Category[]
  onItemsChange?: (items: Item[]) => void
}

export function useBagItems({ bagId, initialItems, categories, onItemsChange }: UseBagItemsProps) {
  const [serverItems, setServerItems] = useState<Item[]>(initialItems)
  const [editMode, setEditMode] = useState(false)
  const [drafts, setDrafts] = useState<RowDraft[]>([])
  const [subDrafts, setSubDrafts] = useState<Record<number, SubDraft[]>>({})
  const [nameErrors, setNameErrors] = useState<Set<number>>(new Set())
  const [subNameErrors, setSubNameErrors] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'category', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [grouping, setGrouping] = useState<GroupingState>(['category'])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editMode) setServerItems(initialItems)
  }, [initialItems])

  function syncItems(next: Item[]) {
    setServerItems(next)
    onItemsChange?.(next)
  }

  function toggleExpand(itemId: number) {
    setExpandedItems(prev => {
      const s = new Set(prev)
      s.has(itemId) ? s.delete(itemId) : s.add(itemId)
      return s
    })
  }

  const columns: ColumnDef<Item>[] = [
    { id: 'packed', size: 36 },
    { accessorKey: 'name', header: 'Name', enableSorting: true, enableGrouping: false },
    { accessorKey: 'quantity', header: 'Qty', size: 52, enableSorting: true, enableGrouping: false },
    {
      id: 'category',
      accessorFn: (row) => categories.find(c => c.id === row.category_id)?.name ?? 'Uncategorized',
      header: 'Category',
      size: 110,
      enableSorting: true,
      enableGrouping: true,
      filterFn: (row, _, value) => value === 'all' ? true : row.original.category_id === value,
    },
  ]

  const table = useReactTable({
    data: serverItems,
    columns,
    state: { sorting, columnFilters, grouping, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    autoResetExpanded: false,
  })

  function enterEdit() {
    setDrafts(serverItems.map(i => ({ ...i })))
    const subs: Record<number, SubDraft[]> = {}
    serverItems.forEach(i => { subs[i.id] = i.sub_items.map(s => ({ ...s })) })
    setSubDrafts(subs)
    setNameErrors(new Set()); setSubNameErrors(new Set()); setSaveErr('')
    setEditMode(true)
    setTimeout(() => firstInputRef.current?.focus(), 50)
  }

  function cancelEdit() {
    setEditMode(false); setDrafts([]); setSubDrafts({})
    setNameErrors(new Set()); setSubNameErrors(new Set()); setSaveErr('')
  }

  function updateDraft(id: number, patch: Partial<RowDraft>) {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))
    if (patch.name !== undefined && nameErrors.has(id)) {
      setNameErrors(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  function addRow() {
    const tid = nextTempId()
    setDrafts(prev => [...prev, { id: tid, name: '', quantity: 1, packed: false, category_id: categories[0]?.id ?? null }])
    setSubDrafts(prev => ({ ...prev, [tid]: [] }))
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-row-name]')
      inputs[inputs.length - 1]?.focus()
    }, 30)
  }

  function removeRow(id: number) {
    if (id > 0) {
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, deleted: true } : d))
    } else {
      setDrafts(prev => prev.filter(d => d.id !== id))
    }
    setNameErrors(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  function getSubDraftsForItem(itemId: number): SubDraft[] { return subDrafts[itemId] ?? [] }

  function addSubRow(itemId: number) {
    const tid = nextTempId()
    setSubDrafts(prev => ({ ...prev, [itemId]: [...(prev[itemId] ?? []), { id: tid, item_id: itemId, name: '', quantity: 1, packed: false }] }))
    setExpandedItems(prev => { const s = new Set(prev); s.add(itemId); return s })
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(`[data-sub-name="${itemId}"]`)
      ;(inputs[inputs.length - 1] as HTMLInputElement)?.focus()
    }, 30)
  }

  function updateSubDraft(itemId: number, subId: number, patch: Partial<SubDraft>) {
    setSubDrafts(prev => ({ ...prev, [itemId]: (prev[itemId] ?? []).map(s => s.id === subId ? { ...s, ...patch } : s) }))
    if (patch.name !== undefined && subNameErrors.has(subId)) {
      setSubNameErrors(prev => { const s = new Set(prev); s.delete(subId); return s })
    }
  }

  function removeSubRow(itemId: number, subId: number) {
    if (subId > 0) {
      setSubDrafts(prev => ({ ...prev, [itemId]: (prev[itemId] ?? []).map(s => s.id === subId ? { ...s, deleted: true } : s) }))
    } else {
      setSubDrafts(prev => ({ ...prev, [itemId]: (prev[itemId] ?? []).filter(s => s.id !== subId) }))
    }
    setSubNameErrors(prev => { const s = new Set(prev); s.delete(subId); return s })
  }

  async function handleSave() {
    const errors = new Set<number>()
    drafts.forEach(d => { if (!d.deleted && !d.name.trim()) errors.add(d.id) })
    const subErrors = new Set<number>()
    Object.values(subDrafts).flat().forEach(s => { if (!s.deleted && !s.name.trim()) subErrors.add(s.id) })

    if (errors.size > 0 || subErrors.size > 0) {
      setNameErrors(errors); setSubNameErrors(subErrors); return
    }

    setSaving(true); setSaveErr('')
    try {
      const toCreate = drafts.filter(d => d.id < 0 && !d.deleted)
      const toUpdate = drafts.filter(d => d.id > 0 && !d.deleted).filter(d => {
        const orig = serverItems.find(i => i.id === d.id)
        return orig && (orig.name !== d.name || orig.category_id !== d.category_id || orig.quantity !== d.quantity)
      })
      const toDelete = drafts.filter(d => d.id > 0 && d.deleted)

      const [created] = await Promise.all([
        Promise.all(toCreate.map(d => api.post<Item>(`/bags/${bagId}/items`, { name: d.name.trim(), quantity: d.quantity, category_id: d.category_id }))),
        Promise.all(toUpdate.map(d => api.put<Item>(`/items/${d.id}`, { name: d.name.trim(), quantity: d.quantity, category_id: d.category_id }))),
        Promise.all(toDelete.map(d => api.delete(`/items/${d.id}`))),
      ])

      const tempToReal = new Map<number, number>()
      toCreate.forEach((d, idx) => tempToReal.set(d.id, created[idx].id))

      const subOps: Promise<unknown>[] = []
      for (const [rawItemId, subs] of Object.entries(subDrafts)) {
        const draftItemId = Number(rawItemId)
        const realItemId = draftItemId < 0 ? tempToReal.get(draftItemId) : draftItemId
        if (!realItemId) continue
        for (const s of subs) {
          if (s.id < 0 && !s.deleted) {
            subOps.push(api.post(`/items/${realItemId}/sub-items`, { name: s.name.trim(), quantity: s.quantity }))
          } else if (s.id > 0 && !s.deleted) {
            const origItem = serverItems.find(i => i.id === realItemId)
            const origSub = origItem?.sub_items.find(os => os.id === s.id)
            if (origSub && (origSub.name !== s.name || origSub.quantity !== s.quantity)) {
              subOps.push(api.put(`/sub-items/${s.id}`, { name: s.name.trim(), quantity: s.quantity }))
            }
          } else if (s.id > 0 && s.deleted) {
            subOps.push(api.delete(`/sub-items/${s.id}`))
          }
        }
      }
      await Promise.all(subOps)

      const freshItems = await api.get<Item[]>(`/bags/${bagId}/items`)
      syncItems(freshItems)
      setEditMode(false); setDrafts([]); setSubDrafts({})
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function togglePacked(item: Item) {
    try {
      const updated = await api.put<Item>(`/items/${item.id}`, { packed: !item.packed })
      syncItems(serverItems.map(i => i.id === updated.id ? { ...i, packed: updated.packed } : i))
    } catch { /* silent */ }
  }

  async function toggleSubPacked(itemId: number, sub: SubItem) {
    try {
      await api.put<SubItem>(`/sub-items/${sub.id}`, { packed: !sub.packed })
      syncItems(serverItems.map(i =>
        i.id === itemId ? { ...i, sub_items: i.sub_items.map(s => s.id === sub.id ? { ...s, packed: !s.packed } : s) } : i
      ))
    } catch { /* silent */ }
  }

  return {
    serverItems,
    editMode,
    drafts: drafts.filter(d => !d.deleted),
    subDrafts,
    nameErrors,
    subNameErrors,
    saving,
    saveErr,
    sorting,
    columnFilters,
    grouping,
    expandedItems,
    firstInputRef,
    table,
    setColumnFilters,
    setGrouping,
    enterEdit,
    cancelEdit,
    updateDraft,
    addRow,
    removeRow,
    getSubDraftsForItem,
    addSubRow,
    updateSubDraft,
    removeSubRow,
    handleSave,
    togglePacked,
    toggleSubPacked,
    toggleExpand,
  }
}
