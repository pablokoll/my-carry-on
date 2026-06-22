import { useState } from 'react'

interface Trip {
  name: string
  start_date?: string | null
  end_date?: string | null
}

interface UpdateTripMutation {
  mutateAsync: (data: { name: string; start_date: string | null; end_date: string | null }) => Promise<unknown>
  isPending: boolean
}

export function useTripEditForm(trip: Trip | undefined, updateTrip: UpdateTripMutation) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [nameErr, setNameErr] = useState('')
  const [err, setErr] = useState('')

  function openEdit() {
    if (!trip) return
    setName(trip.name)
    setStart(trip.start_date ?? '')
    setEnd(trip.end_date ?? '')
    setNameErr(''); setErr('')
    setOpen(true)
  }

  async function handleSubmit() {
    if (!name.trim()) { setNameErr('Name is required'); return }
    setNameErr(''); setErr('')
    try {
      await updateTrip.mutateAsync({ name: name.trim(), start_date: start || null, end_date: end || null })
      setOpen(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to update trip')
    }
  }

  return {
    open, setOpen,
    name, setName,
    start, setStart,
    end, setEnd,
    nameErr, err,
    openEdit,
    handleSubmit,
    isPending: updateTrip.isPending,
  }
}
