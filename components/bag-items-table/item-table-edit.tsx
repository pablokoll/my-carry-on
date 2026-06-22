'use client'

import React from 'react'
import { catSelect, btnPrimary, btnSecondary, btnGhost, btnLink } from '@/lib/styles'
import { catColor, cellInner, td, th, cellInput, qtyInput } from './constants'
import type { Category, RowDraft, SubDraft } from './types'

interface ItemTableEditProps {
  drafts: RowDraft[]
  subDrafts: Record<number, SubDraft[]>
  categories: Category[]
  nameErrors: Set<number>
  subNameErrors: Set<number>
  saving: boolean
  saveErr: string
  expandedItems: Set<number>
  firstInputRef: React.RefObject<HTMLInputElement>
  getSubDraftsForItem: (id: number) => SubDraft[]
  updateDraft: (id: number, patch: Partial<RowDraft>) => void
  removeRow: (id: number) => void
  addRow: () => void
  addSubRow: (itemId: number) => void
  updateSubDraft: (itemId: number, subId: number, patch: Partial<SubDraft>) => void
  removeSubRow: (itemId: number, subId: number) => void
  toggleExpand: (itemId: number) => void
  cancelEdit: () => void
  handleSave: () => void
}

export function ItemTableEdit({
  drafts, subDrafts, categories, nameErrors, subNameErrors,
  saving, saveErr, expandedItems, firstInputRef,
  getSubDraftsForItem, updateDraft, removeRow, addRow,
  addSubRow, updateSubDraft, removeSubRow, toggleExpand,
  cancelEdit, handleSave,
}: ItemTableEditProps) {

  function renderEditRow(draft: RowDraft, idx: number) {
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

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '36px' }} />
            <col />
            <col style={{ width: '52px' }} />
            <col style={{ width: '130px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={th} />
              <th style={th}>Name</th>
              <th style={{ ...th, textAlign: 'center' }}>Qty</th>
              <th style={th}>Category</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft, idx) => renderEditRow(draft, idx))}
          </tbody>
        </table>
      </div>

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
    </>
  )
}
