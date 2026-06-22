'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type GroupingState,
  type ExpandedState,
} from '@tanstack/react-table'
import { api } from '@/lib/api'
import { btnPrimary, btnSecondary, btnGhost, btnLink, catSelect } from '@/lib/styles'

export interface Category {
  id: number
  name: string
}

export interface SubItem {
  id: number
  item_id: number
  name: string
  quantity: number
  packed: boolean
}

export interface Item {
  id: number
  name: string
  quantity: number
  packed: boolean
  category_id: number | null
  sub_items: SubItem[]
}

const COLORS = [
  { bg: 'rgba(74,123,181,0.08)',  dot: '#4a7bb5' },
  { bg: 'rgba(94,164,110,0.10)',  dot: '#5ea46e' },
  { bg: 'rgba(198,120,60,0.10)',  dot: '#c6783c' },
  { bg: 'rgba(155,89,182,0.10)',  dot: '#9b59b6' },
  { bg: 'rgba(231,76,60,0.10)',   dot: '#e74c3c' },
  { bg: 'rgba(22,160,133,0.10)',  dot: '#16a085' },
  { bg: 'rgba(241,196,15,0.12)',  dot: '#c8a000' },
  { bg: 'rgba(52,73,94,0.08)',    dot: '#34495e' },
]

export function catColor(categoryId: number | null) {
  if (categoryId === null) return null
  return COLORS[categoryId % COLORS.length]
}

let _tempId = -1
function nextTempId() { return _tempId-- }

interface RowDraft {
  id: number
  name: string
  quantity: number
  packed: boolean
  category_id: number | null
  deleted?: boolean
}

interface SubDraft {
  id: number
  item_id: number
  name: string
  quantity: number
  packed: boolean
  deleted?: boolean
}

// ── Styles ───────────────────────────────────────────────────────────────────

const th: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--fg-muted)',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
  userSelect: 'none',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '0',
  verticalAlign: 'middle',
}

const cellInner: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--foreground)',
}

function cellInput(isError?: boolean): React.CSSProperties {
  return {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    fontSize: '14px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '6px',
    color: 'var(--foreground)',
    outline: 'none',
    transition: 'border-color 120ms, box-shadow 120ms',
    borderColor: isError ? 'var(--destructive)' : 'transparent',
  }
}

const qtyInput: React.CSSProperties = {
  width: '64px',
  height: '36px',
  padding: '0 8px',
  fontSize: '14px',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '6px',
  color: 'var(--foreground)',
  outline: 'none',
  textAlign: 'center',
}

// ── Component ────────────────────────────────────────────────────────────────

interface BagItemsTableProps {
  bagId: number
  initialItems: Item[]
  categories: Category[]
  onItemsChange?: (items: Item[]) => void
  showPacked?: boolean
}

export function BagItemsTable({ bagId, initialItems, categories, onItemsChange, showPacked = true }: BagItemsTableProps) {
  const [serverItems, setServerItems] = useState<Item[]>(initialItems)
  const [editMode, setEditMode] = useState(false)
  const [drafts, setDrafts] = useState<RowDraft[]>([])
  const [subDrafts, setSubDrafts] = useState<Record<number, SubDraft[]>>({})
  const [nameErrors, setNameErrors] = useState<Set<number>>(new Set())
  const [subNameErrors, setSubNameErrors] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'category', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [grouping, setGrouping] = useState<GroupingState>(['category'])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // sub-item expand state (separate from table row grouping expand)
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

  // ── TanStack Table columns ─────────────────────────────────────────────────

  const columns: ColumnDef<Item>[] = [
    {
      id: 'packed',
      size: 36,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
      enableGrouping: false,
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      size: 52,
      enableSorting: true,
      enableGrouping: false,
    },
    {
      id: 'category',
      accessorFn: (row) => {
        const cat = categories.find(c => c.id === row.category_id)
        return cat?.name ?? 'Uncategorized'
      },
      header: 'Category',
      size: 110,
      enableSorting: true,
      enableGrouping: true,
      filterFn: (row, _, value) => {
        if (value === 'all') return true
        return row.original.category_id === value
      },
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

  // ── Edit mode ──────────────────────────────────────────────────────────────

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

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderViewItem(item: Item, catName: string | null) {
    const color = catColor(item.category_id)
    const expandedSubs = expandedItems.has(item.id)
    const hasSubs = item.sub_items.length > 0

    return (
      <React.Fragment key={item.id}>
        <tr onClick={hasSubs ? () => toggleExpand(item.id) : undefined} style={{ background: color?.bg ?? 'transparent', opacity: showPacked && item.packed ? 0.55 : 1, transition: 'opacity 180ms', cursor: hasSubs ? 'pointer' : 'default' }}>
          <td style={{ padding: '0', textAlign: 'center', verticalAlign: 'middle' }}>
            {hasSubs ? (
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '10px', padding: '0 8px', lineHeight: 1, transition: 'transform 120ms', transform: expandedSubs ? 'rotate(90deg)' : 'none' }}>▶</button>
            ) : showPacked ? (
              <input type="checkbox" checked={item.packed} onChange={() => togglePacked(item)} onClick={e => e.stopPropagation()} style={{ width: '15px', height: '15px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
            ) : null}
          </td>
          <td style={{ padding: '0', verticalAlign: 'middle' }}>
            <div style={{ ...cellInner, textDecoration: showPacked && item.packed ? 'line-through' : 'none' }}>{item.name}</div>
          </td>
          <td style={{ padding: '0', textAlign: 'center', verticalAlign: 'middle' }}>
            <div style={{ ...cellInner, color: item.quantity > 1 ? 'var(--foreground)' : 'var(--fg-muted)' }}>{item.quantity}</div>
          </td>
          <td style={{ padding: '0', verticalAlign: 'middle' }}>
            {color && catName ? (
              <div style={{ ...cellInner, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color.dot, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{catName}</span>
              </div>
            ) : (
              <div style={{ ...cellInner, color: 'var(--fg-muted)', fontSize: '13px' }}>—</div>
            )}
          </td>
        </tr>
        {hasSubs && expandedSubs && item.sub_items.map(sub => (
          <tr key={`sub-${sub.id}`} style={{ background: color ? color.bg : 'transparent', opacity: showPacked && sub.packed ? 0.5 : 0.85 }}>
            <td style={{ padding: '0', textAlign: 'center', verticalAlign: 'middle' }}>
              {showPacked && <input type="checkbox" checked={sub.packed} onChange={() => toggleSubPacked(item.id, sub)} style={{ width: '13px', height: '13px', accentColor: 'var(--primary)', cursor: 'pointer' }} />}
            </td>
            <td style={{ padding: '0', verticalAlign: 'middle' }}>
              <div style={{ ...cellInner, fontSize: '12px', paddingLeft: '24px', textDecoration: showPacked && sub.packed ? 'line-through' : 'none', color: 'var(--fg-secondary)' }}>{sub.name}</div>
            </td>
            <td style={{ padding: '0', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ ...cellInner, fontSize: '12px', color: sub.quantity > 1 ? 'var(--foreground)' : 'var(--fg-muted)' }}>{sub.quantity}</div>
            </td>
            <td />
          </tr>
        ))}
      </React.Fragment>
    )
  }

  function renderEditItem(draft: RowDraft, idx: number) {
    const color = catColor(draft.category_id)
    const expandedSubs = expandedItems.has(draft.id)
    const subs = getSubDraftsForItem(draft.id).filter(s => !s.deleted)
    const hasSubs = subs.length > 0

    return (
      <React.Fragment key={draft.id}>
        <tr style={{ background: color?.bg ?? 'transparent', transition: 'background 120ms' }}>
          <td style={td}>
            <button style={{ ...btnGhost, color: 'var(--destructive)', padding: '0 8px', fontSize: '16px', lineHeight: 1 }} onClick={() => removeRow(draft.id)} title="Remove">×</button>
          </td>
          <td style={td}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => toggleExpand(draft.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '10px', padding: '0 4px', lineHeight: 1, transition: 'transform 120ms', transform: expandedSubs ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>▶</button>
              <input
                ref={idx === 0 ? firstInputRef : undefined}
                data-row-name
                type="text"
                value={draft.name}
                placeholder="Item name"
                onChange={e => updateDraft(draft.id, { name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') addRow() }}
                style={cellInput(nameErrors.has(draft.id))}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = 'var(--shadow-focus)' }}
                onBlur={e => { e.target.style.borderColor = nameErrors.has(draft.id) ? 'var(--destructive)' : 'transparent'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </td>
          <td style={{ ...td, textAlign: 'center' }}>
            {hasSubs ? (
              <div style={{ ...cellInner, color: 'var(--fg-muted)', fontSize: '13px', textAlign: 'center' }}>{subs.reduce((a, s) => a + s.quantity, 0)}</div>
            ) : (
              <input
                type="number" min="1" value={draft.quantity}
                onChange={e => updateDraft(draft.id, { quantity: Number(e.target.value) || 1 })}
                style={qtyInput}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = 'var(--shadow-focus)' }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none' }}
              />
            )}
          </td>
          <td style={td}>
            <select
              value={draft.category_id !== null ? String(draft.category_id) : ''}
              onChange={e => updateDraft(draft.id, { category_id: e.target.value ? Number(e.target.value) : null })}
              style={{ ...catSelect, background: color ? color.bg : 'var(--bg-surface)', borderColor: color ? color.dot + '40' : 'var(--border)' }}
            >
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </td>
        </tr>
        {expandedSubs && (
          <>
            {subs.map(sub => (
              <tr key={`sub-${sub.id}`} style={{ background: color ? color.bg : 'transparent' }}>
                <td style={td}>
                  <button style={{ ...btnGhost, color: 'var(--destructive)', padding: '0 8px', fontSize: '14px', lineHeight: 1 }} onClick={() => removeSubRow(draft.id, sub.id)} title="Remove sub-item">×</button>
                </td>
                <td style={{ ...td, paddingLeft: '20px' }}>
                  <input
                    data-sub-name={draft.id}
                    type="text" value={sub.name} placeholder="Sub-item name"
                    onChange={e => updateSubDraft(draft.id, sub.id, { name: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') addSubRow(draft.id) }}
                    style={{ ...cellInput(subNameErrors.has(sub.id)), fontSize: '12px', height: '30px', paddingLeft: '8px' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = 'var(--shadow-focus)' }}
                    onBlur={e => { e.target.style.borderColor = subNameErrors.has(sub.id) ? 'var(--destructive)' : 'transparent'; e.target.style.boxShadow = 'none' }}
                  />
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <input
                    type="number" min="1" value={sub.quantity}
                    onChange={e => updateSubDraft(draft.id, sub.id, { quantity: Number(e.target.value) || 1 })}
                    style={{ ...qtyInput, height: '30px', fontSize: '12px' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = 'var(--shadow-focus)' }}
                    onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none' }}
                  />
                </td>
                <td />
              </tr>
            ))}
            <tr style={{ background: color ? color.bg : 'transparent' }}>
              <td /><td colSpan={3} style={{ paddingLeft: '20px', paddingBottom: '4px' }}>
                <button style={{ ...btnLink, fontSize: '12px', paddingLeft: '8px' }} onClick={() => addSubRow(draft.id)}>+ Add sub-item</button>
              </td>
            </tr>
          </>
        )}
      </React.Fragment>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────

  const isEmpty = serverItems.length === 0 && !editMode
  const isGrouped = grouping.length > 0
  const filterCatId = (columnFilters.find(f => f.id === 'category')?.value as number | 'all') ?? 'all'
  const visibleDrafts = drafts.filter(d => !d.deleted)

  return (
    <div>
      {serverItems.length > 0 && !editMode && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <select
              value={filterCatId === 'all' ? 'all' : String(filterCatId)}
              onChange={e => setColumnFilters(e.target.value === 'all' ? [] : [{ id: 'category', value: Number(e.target.value) }])}
              style={{ ...catSelect, width: 'auto', minWidth: '100px', height: '26px', fontSize: '11px', padding: '0 6px' }}
            >
              <option value="all">All</option>
              {categories.filter(c => serverItems.some(i => i.category_id === c.id)).map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            <button
              style={{ ...btnSecondary, fontSize: '11px', height: '26px', padding: '0 8px' }}
              onClick={() => setGrouping(g => g.length > 0 ? [] : ['category'])}
            >
              {isGrouped ? 'Ungroup' : 'Group'}
            </button>
          </div>
          <button style={{ ...btnPrimary, height: '26px', padding: '0 10px', fontSize: '12px' }} onClick={enterEdit}>Edit</button>
        </div>
      )}

      {isEmpty ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px', marginBottom: '12px' }}>No items yet.</p>
          <button style={{ ...btnPrimary, height: '34px', fontSize: '13px' }} onClick={enterEdit}>Add items</button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '36px' }} />
              <col />
              <col style={{ width: '52px' }} />
              <col style={{ width: editMode ? '130px' : '110px' }} />
            </colgroup>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        style={{ ...th, cursor: canSort ? 'pointer' : 'default', textAlign: header.id === 'quantity' ? 'center' : 'left' }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (sorted === 'asc' ? ' ↑' : sorted === 'desc' ? ' ↓' : ' ↕')}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {editMode ? (
                visibleDrafts.map((draft, idx) => renderEditItem(draft, idx))
              ) : (
                table.getRowModel().rows.map(row => {
                  if (row.getIsGrouped()) {
                    const catName = row.getValue<string>('category')
                    const catId = categories.find(c => c.name === catName)?.id ?? null
                    const color = catColor(catId)
                    return (
                      <React.Fragment key={row.id}>
                        <tr>
                          <td colSpan={4} style={{
                            padding: '10px 12px 4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: color?.dot ?? 'var(--fg-muted)',
                            borderBottom: `1px solid ${color ? color.dot + '30' : 'var(--border)'}`,
                          }}>
                            {color && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: color.dot, marginRight: '6px', verticalAlign: 'middle' }} />}
                            {catName}
                          </td>
                        </tr>
                        {row.subRows.map(subRow => {
                          const item = subRow.original
                          return renderViewItem(item, catName !== 'Uncategorized' ? catName : null)
                        })}
                      </React.Fragment>
                    )
                  }
                  return renderViewItem(row.original, categories.find(c => c.id === row.original.category_id)?.name ?? null)
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {editMode && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button style={btnLink} onClick={addRow}>+ Add row</button>
          {saveErr && <p style={{ fontSize: '13px', color: 'var(--destructive)', margin: 0 }}>{saveErr}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={btnSecondary} onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
