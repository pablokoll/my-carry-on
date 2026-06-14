'use client'

import React, { useRef, useState } from 'react'
import { api } from '@/lib/api'

export interface Category {
  id: number
  name: string
}

export interface Item {
  id: number
  name: string
  quantity: number
  packed: boolean
  category_id: number | null
}

// Stable palette — index maps to category id % COLORS.length
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

type SortKey = 'name' | 'category' | 'quantity'
type GroupMode = 'none' | 'category'

// ── Styles ──────────────────────────────────────────────────────────────────

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

const catSelect: React.CSSProperties = {
  width: '100%',
  height: '36px',
  padding: '0 8px',
  fontSize: '13px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--foreground)',
  outline: 'none',
  cursor: 'pointer',
}

const btnPrimary: React.CSSProperties = {
  height: '36px',
  padding: '0 18px',
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  height: '36px',
  padding: '0 18px',
  background: 'transparent',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--fg-muted)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '4px 8px',
}

const btnLink: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--primary)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '4px 0',
  fontWeight: 500,
}

// ── Component ────────────────────────────────────────────────────────────────

interface BagItemsTableProps {
  bagId: number
  initialItems: Item[]
  categories: Category[]
  /** Callback when items change (optional, for parent state sync) */
  onItemsChange?: (items: Item[]) => void
}

export function BagItemsTable({ bagId, initialItems, categories, onItemsChange }: BagItemsTableProps) {
  const [serverItems, setServerItems] = useState<Item[]>(initialItems)
  const [editMode, setEditMode] = useState(false)
  const [drafts, setDrafts] = useState<RowDraft[]>([])
  const [nameErrors, setNameErrors] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const [sortKey, setSortKey] = useState<SortKey>('category')
  const [sortAsc, setSortAsc] = useState(true)
  const [groupMode, setGroupMode] = useState<GroupMode>('category')
  const [filterCatId, setFilterCatId] = useState<number | 'all'>('all')

  const firstInputRef = useRef<HTMLInputElement>(null)

  function syncItems(next: Item[]) {
    setServerItems(next)
    onItemsChange?.(next)
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────

  function enterEdit() {
    setDrafts(serverItems.map(i => ({ ...i })))
    setNameErrors(new Set())
    setSaveErr('')
    setEditMode(true)
    setTimeout(() => firstInputRef.current?.focus(), 50)
  }

  function cancelEdit() {
    setEditMode(false)
    setDrafts([])
    setNameErrors(new Set())
    setSaveErr('')
  }

  function updateDraft(id: number, patch: Partial<RowDraft>) {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))
    if (patch.name !== undefined && nameErrors.has(id)) {
      setNameErrors(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  function addRow() {
    const tid = nextTempId()
    setDrafts(prev => [...prev, {
      id: tid,
      name: '',
      quantity: 1,
      packed: false,
      category_id: categories[0]?.id ?? null,
    }])
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

  async function handleSave() {
    const errors = new Set<number>()
    drafts.forEach(d => { if (!d.deleted && !d.name.trim()) errors.add(d.id) })
    if (errors.size > 0) { setNameErrors(errors); return }

    setSaving(true); setSaveErr('')
    try {
      const toCreate = drafts.filter(d => d.id < 0 && !d.deleted)
      const toUpdate = drafts.filter(d => d.id > 0 && !d.deleted).filter(d => {
        const orig = serverItems.find(i => i.id === d.id)
        return orig && (orig.name !== d.name || orig.quantity !== d.quantity || orig.category_id !== d.category_id)
      })
      const toDelete = drafts.filter(d => d.id > 0 && d.deleted)

      const [created, updated] = await Promise.all([
        Promise.all(toCreate.map(d =>
          api.post<Item>(`/bags/${bagId}/items`, {
            name: d.name.trim(),
            quantity: d.quantity,
            category_id: d.category_id,
          })
        )),
        Promise.all(toUpdate.map(d =>
          api.put<Item>(`/items/${d.id}`, {
            name: d.name.trim(),
            quantity: d.quantity,
            category_id: d.category_id,
          })
        )),
        Promise.all(toDelete.map(d => api.delete(`/items/${d.id}`))),
      ])

      let next = serverItems.filter(i => !toDelete.find(d => d.id === i.id))
      next = next.map(i => updated.find(u => u.id === i.id) ?? i)
      next = [...next, ...created]
      syncItems(next)
      setEditMode(false)
      setDrafts([])
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function togglePacked(item: Item) {
    try {
      const updated = await api.put<Item>(`/items/${item.id}`, { packed: !item.packed })
      syncItems(serverItems.map(i => i.id === updated.id ? updated : i))
    } catch { /* silent */ }
  }

  // ── View helpers ──────────────────────────────────────────────────────────

  function sortList<T extends { name: string; quantity: number; category_id: number | null }>(list: T[]): T[] {
    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'quantity') cmp = a.quantity - b.quantity
      else {
        const ca = categories.find(c => c.id === a.category_id)?.name ?? 'zz'
        const cb = categories.find(c => c.id === b.category_id)?.name ?? 'zz'
        cmp = ca.localeCompare(cb)
      }
      return sortAsc ? cmp : -cmp
    })
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <span style={{ opacity: 0.3 }}>↕</span>
    return <span>{sortAsc ? '↑' : '↓'}</span>
  }

  const visibleItems = (() => {
    const list = filterCatId === 'all' ? serverItems : serverItems.filter(i => i.category_id === filterCatId)
    return sortList(list)
  })()

  const visibleDrafts = drafts.filter(d => !d.deleted)

  function groupByCategory<T extends { category_id: number | null }>(list: T[]) {
    const map = new Map<number | null, T[]>()
    for (const item of list) {
      const key = item.category_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return Array.from(map.entries())
      .map(([catId, items]) => ({
        catId,
        label: categories.find(c => c.id === catId)?.name ?? 'Uncategorized',
        items,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  const packed = serverItems.filter(i => i.packed).length
  const isEmpty = serverItems.length === 0 && !editMode

  return (
    <div>
      {/* Toolbar */}
      {serverItems.length > 0 && !editMode && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>{packed}/{serverItems.length} packed</span>
            <select
              value={filterCatId === 'all' ? 'all' : String(filterCatId)}
              onChange={e => setFilterCatId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              style={{ ...catSelect, width: 'auto', minWidth: '100px', height: '26px', fontSize: '11px', padding: '0 6px' }}
            >
              <option value="all">All</option>
              {categories.filter(c => serverItems.some(i => i.category_id === c.id)).map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            <button
              style={{ ...btnSecondary, fontSize: '11px', height: '26px', padding: '0 8px' }}
              onClick={() => setGroupMode(g => g === 'category' ? 'none' : 'category')}
            >
              {groupMode === 'category' ? 'Ungroup' : 'Group'}
            </button>
          </div>
          <button style={{ ...btnPrimary, height: '26px', padding: '0 10px', fontSize: '12px' }} onClick={enterEdit}>
            Edit
          </button>
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
              {editMode && <col style={{ width: '36px' }} />}
              {!editMode && <col style={{ width: '36px' }} />}
              <col />
              <col style={{ width: '52px' }} />
              <col style={{ width: editMode ? '130px' : '110px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={th} />
                <th style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                  Name {sortIcon('name')}
                </th>
                <th style={{ ...th, cursor: 'pointer', textAlign: 'center' }} onClick={() => toggleSort('quantity')}>
                  Qty {sortIcon('quantity')}
                </th>
                <th style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort('category')}>
                  Category {sortIcon('category')}
                </th>
              </tr>
            </thead>
            <tbody>
              {editMode ? (
                visibleDrafts.map((draft, idx) => {
                  const color = catColor(draft.category_id)
                  return (
                    <tr key={draft.id} style={{ background: color?.bg ?? 'transparent', transition: 'background 120ms' }}>
                      <td style={td}>
                        <button
                          style={{ ...btnGhost, color: 'var(--destructive)', padding: '0 8px', fontSize: '16px', lineHeight: 1 }}
                          onClick={() => removeRow(draft.id)}
                          title="Remove"
                        >×</button>
                      </td>
                      <td style={td}>
                        <input
                          ref={idx === 0 ? firstInputRef : undefined}
                          data-row-name
                          type="text"
                          value={draft.name}
                          placeholder="Item name"
                          onChange={e => updateDraft(draft.id, { name: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') addRow() }}
                          style={cellInput(nameErrors.has(draft.id))}
                          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; (e.target as HTMLInputElement).style.boxShadow = 'var(--shadow-focus)' }}
                          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = nameErrors.has(draft.id) ? 'var(--destructive)' : 'transparent'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                        />
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          value={draft.quantity}
                          onChange={e => updateDraft(draft.id, { quantity: Number(e.target.value) || 1 })}
                          style={qtyInput}
                          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; (e.target as HTMLInputElement).style.boxShadow = 'var(--shadow-focus)' }}
                          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'transparent'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                        />
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
                  )
                })
              ) : groupMode === 'category' ? (
                groupByCategory(visibleItems).map(group => (
                  <React.Fragment key={`g-${group.catId}`}>
                    <tr>
                      <td colSpan={4} style={{
                        padding: '10px 12px 4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: group.catId !== null ? catColor(group.catId)?.dot : 'var(--fg-muted)',
                        borderBottom: `1px solid ${group.catId !== null ? (catColor(group.catId)?.dot + '30') : 'var(--border)'}`,
                      }}>
                        {group.catId !== null && (
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: catColor(group.catId)?.dot, marginRight: '6px', verticalAlign: 'middle' }} />
                        )}
                        {group.label}
                      </td>
                    </tr>
                    {group.items.map(item => (
                      <ViewRow
                        key={item.id}
                        item={item}
                        color={catColor(item.category_id)}
                        catName={group.catId !== null ? group.label : null}
                        onToggle={togglePacked}
                      />
                    ))}
                  </React.Fragment>
                ))
              ) : (
                visibleItems.map(item => {
                  const catName = categories.find(c => c.id === item.category_id)?.name ?? null
                  return (
                    <ViewRow
                      key={item.id}
                      item={item}
                      color={catColor(item.category_id)}
                      catName={catName}
                      onToggle={togglePacked}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit footer */}
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

// ── ViewRow ──────────────────────────────────────────────────────────────────

function ViewRow({
  item,
  color,
  catName,
  onToggle,
}: {
  item: Item
  color: { bg: string; dot: string } | null
  catName: string | null
  onToggle: (item: Item) => void
}) {
  return (
    <tr style={{ background: color?.bg ?? 'transparent', opacity: item.packed ? 0.55 : 1, transition: 'opacity 180ms, background 120ms' }}>
      <td style={{ padding: '0', textAlign: 'center', verticalAlign: 'middle' }}>
        <input
          type="checkbox"
          checked={item.packed}
          onChange={() => onToggle(item)}
          style={{ width: '15px', height: '15px', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
      </td>
      <td style={{ padding: '0', verticalAlign: 'middle' }}>
        <div style={{ ...cellInner, textDecoration: item.packed ? 'line-through' : 'none' }}>{item.name}</div>
      </td>
      <td style={{ padding: '0', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ ...cellInner, color: item.quantity > 1 ? 'var(--foreground)' : 'var(--fg-muted)' }}>
          {item.quantity}
        </div>
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
  )
}
