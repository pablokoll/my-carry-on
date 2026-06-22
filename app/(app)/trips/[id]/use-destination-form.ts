import { useState } from 'react'
import type { Destination } from '@/lib/queries'

type DestData = { city: string; country: string; arrival_date?: string | null; departure_date?: string | null }

interface AddMutation {
  mutateAsync: (data: DestData) => Promise<unknown>
  isPending: boolean
}

interface UpdateMutation {
  mutateAsync: (args: { destId: number; data: DestData }) => Promise<unknown>
  isPending: boolean
}

export function useDestinationForm(addDest: AddMutation, updateDest: UpdateMutation) {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [cityErr, setCityErr] = useState('')
  const [countryErr, setCountryErr] = useState('')
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<Destination | null>(null)

  function close() {
    setOpen(false); setEditing(null)
    setCity(''); setCountry(''); setArrival(''); setDeparture('')
    setCityErr(''); setCountryErr(''); setErr('')
  }

  function openAdd() {
    setEditing(null)
    setCity(''); setCountry(''); setArrival(''); setDeparture('')
    setCityErr(''); setCountryErr(''); setErr('')
    setOpen(true)
  }

  function openEdit(dest: Destination) {
    setEditing(dest)
    setCity(dest.city); setCountry(dest.country)
    setArrival(dest.arrival_date ?? ''); setDeparture(dest.departure_date ?? '')
    setCityErr(''); setCountryErr(''); setErr('')
    setOpen(true)
  }

  async function handleSubmit() {
    let valid = true
    if (!city.trim()) { setCityErr('City is required'); valid = false } else setCityErr('')
    if (!country.trim()) { setCountryErr('Country is required'); valid = false } else setCountryErr('')
    if (!valid) return
    setErr('')
    const data: DestData = { city: city.trim(), country: country.trim(), arrival_date: arrival || null, departure_date: departure || null }
    try {
      if (editing) {
        await updateDest.mutateAsync({ destId: editing.id, data })
      } else {
        await addDest.mutateAsync(data)
      }
      close()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save destination')
    }
  }

  return {
    open, city, setCity, country, setCountry,
    arrival, setArrival, departure, setDeparture,
    cityErr, countryErr, err, editing,
    close, openAdd, openEdit, handleSubmit,
    isPending: addDest.isPending || updateDest.isPending,
  }
}
