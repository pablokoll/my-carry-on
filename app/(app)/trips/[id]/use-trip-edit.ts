import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Trip, TripInput } from '@/lib/queries'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export type TripEditFormData = z.infer<typeof schema>

interface UpdateTripMutation {
  mutateAsync: (data: TripInput) => Promise<unknown>
  isPending: boolean
}

export function useTripEditForm(trip: Trip | undefined, updateTrip: UpdateTripMutation) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<TripEditFormData>({ resolver: zodResolver(schema) })

  function openEdit() {
    if (!trip) return
    form.reset({ name: trip.name, start_date: trip.start_date ?? '', end_date: trip.end_date ?? '' })
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(data: TripEditFormData) {
    setError(null)
    try {
      await updateTrip.mutateAsync({ name: data.name, start_date: data.start_date || null, end_date: data.end_date || null })
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update trip')
    }
  }

  return { open, setOpen, error, form, openEdit, handleSubmit, isPending: updateTrip.isPending }
}
