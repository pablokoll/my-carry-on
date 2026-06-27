import { useState } from 'react'
import type { Bag } from '@/lib/queries'

interface AssignMutation {
  mutateAsync: (bagId: number) => Promise<unknown>
  isPending: boolean
}

export function useBagAssignment(unassignedBags: Bag[], assignBag: AssignMutation) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [err, setErr] = useState('')

  function openModal() {
    const first = unassignedBags[0]
    setSelectedId(first ? String(first.id) : '')
    setErr(''); setOpen(true)
  }

  async function handleAssign() {
    if (!selectedId) return
    setErr('')
    try {
      await assignBag.mutateAsync(Number(selectedId))
      setOpen(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to assign bag')
    }
  }

  async function handleBagCreated(bag: Bag) {
    try {
      await assignBag.mutateAsync(bag.id)
    } catch { /* silent */ }
  }

  return {
    open, setOpen,
    selectedId, setSelectedId,
    err,
    openModal,
    handleAssign,
    handleBagCreated,
    isPending: assignBag.isPending,
  }
}
