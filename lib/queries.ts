import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Bag } from '@/components/create-bag-modal'
import type { Category, Item } from '@/components/bag-items-table'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Trip {
  id: number
  name: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  bags?: BagSummary[]
  items_total?: number
  items_packed?: number
}

export interface BagSummary {
  id: number
  name: string
  type: string
  items_total: number
  items_packed: number
}

export interface Destination {
  id: number
  city: string
  country: string
  arrival_date: string | null
  departure_date: string | null
}

export interface ChatSession {
  id: number
  title: string | null
  created_at: string
  message_count: number
}

export interface ChatMessage {
  id: number
  role: 'user' | 'model' | 'summary'
  content: string
  created_at: string
}

export type BagWithItems = Bag & { items: Item[] }

// ── Query keys ────────────────────────────────────────────────────────────────

export const keys = {
  trips: () => ['trips'] as const,
  trip: (id: number | string) => ['trips', Number(id)] as const,
  tripBags: (id: number | string) => ['trips', Number(id), 'bags'] as const,
  tripDestinations: (id: number | string) => ['trips', Number(id), 'destinations'] as const,
  bags: () => ['bags'] as const,
  bag: (id: number | string) => ['bags', Number(id)] as const,
  bagItems: (id: number | string) => ['bags', Number(id), 'items'] as const,
  categories: () => ['categories'] as const,
  chatSessions: (tripId: number) => ['chat', 'sessions', tripId] as const,
  chatMessages: (sessionId: number) => ['chat', 'sessions', sessionId, 'messages'] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export const useTrips = () => useQuery({
  queryKey: keys.trips(),
  queryFn: () => api.get<Trip[]>('/trips'),
})

export const useTripDetail = (id: number | string) => useQuery({
  queryKey: keys.trip(id),
  queryFn: () => api.get<Trip>(`/trips/${id}`),
  enabled: !!id,
})

export const useTripBags = (id: number | string) => useQuery({
  queryKey: keys.tripBags(id),
  queryFn: () => api.get<BagWithItems[]>(`/trips/${id}/bags`),
  enabled: !!id,
})

export const useTripDestinations = (id: number | string) => useQuery({
  queryKey: keys.tripDestinations(id),
  queryFn: () => api.get<Destination[]>(`/trips/${id}/destinations`),
  enabled: !!id,
})

export const useAllBags = () => useQuery({
  queryKey: keys.bags(),
  queryFn: () => api.get<Bag[]>('/bags'),
})

export const useBagDetail = (id: number | string) => useQuery({
  queryKey: keys.bag(id),
  queryFn: () => api.get<BagWithItems>(`/bags/${id}`),
  enabled: !!id,
})

export const useBagItems = (id: number | string) => useQuery({
  queryKey: keys.bagItems(id),
  queryFn: () => api.get<Item[]>(`/bags/${id}/items`),
  enabled: !!id,
})

export const useCategories = () => useQuery({
  queryKey: keys.categories(),
  queryFn: () => api.get<Category[]>('/categories'),
  staleTime: Infinity,
})

export const useChatSessions = (tripId: number | null) => useQuery({
  queryKey: tripId != null ? keys.chatSessions(tripId) : ['chat', 'sessions', null],
  queryFn: () => api.get<ChatSession[]>(`/chat/sessions?trip_id=${tripId}`),
  enabled: tripId != null,
})

export const useChatMessages = (sessionId: number | null) => useQuery({
  queryKey: sessionId != null ? keys.chatMessages(sessionId) : ['chat', 'sessions', null, 'messages'],
  queryFn: () => api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`),
  enabled: sessionId != null,
  staleTime: 0,
})

// ── Trip mutations ────────────────────────────────────────────────────────────

export const useCreateTrip = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; start_date?: string | null; end_date?: string | null }) =>
      api.post<Trip>('/trips', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.trips() }),
  })
}

export const useUpdateTrip = (id: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; start_date?: string | null; end_date?: string | null }) =>
      api.put<Trip>(`/trips/${id}`, data),
    onSuccess: (updated) => {
      qc.setQueryData(keys.trip(id), updated)
      qc.invalidateQueries({ queryKey: keys.trips() })
    },
  })
}

export const useDeleteTrip = (id: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/trips/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.trips() }),
  })
}

export const useToggleTripActive = (id: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (isActive: boolean) =>
      api.post<Trip>(`/trips/${id}/${isActive ? 'deactivate' : 'activate'}`, {}),
    onSuccess: (updated) => {
      qc.setQueryData(keys.trip(id), updated)
      qc.invalidateQueries({ queryKey: keys.trips() })
    },
  })
}

// ── Destination mutations ─────────────────────────────────────────────────────

export const useAddDestination = (tripId: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { city: string; country: string; arrival_date?: string | null; departure_date?: string | null }) =>
      api.post<Destination>(`/trips/${tripId}/destinations`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tripDestinations(tripId) }),
  })
}

export const useUpdateDestination = (tripId: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ destId, data }: { destId: number; data: { city: string; country: string; arrival_date?: string | null; departure_date?: string | null } }) =>
      api.put<Destination>(`/destinations/${destId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tripDestinations(tripId) }),
  })
}

export const useDeleteDestination = (tripId: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (destId: number) => api.delete(`/destinations/${destId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tripDestinations(tripId) }),
  })
}

// ── Bag mutations ─────────────────────────────────────────────────────────────

export const useCreateBag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; type: string }) => api.post<Bag>('/bags', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bags() }),
  })
}

export const useUpdateBag = (id: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; type: string }) => api.put<Bag>(`/bags/${id}`, data),
    onSuccess: (updated) => {
      qc.setQueryData(keys.bag(id), (old: BagWithItems | undefined) => old ? { ...old, ...updated } : old)
      qc.invalidateQueries({ queryKey: keys.bags() })
    },
  })
}

export const useDeleteBag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/bags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bags() }),
  })
}

export const useDuplicateBag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<Bag>(`/bags/${id}/duplicate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bags() }),
  })
}

export const useAssignBag = (tripId: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bagId: number) => api.post(`/trips/${tripId}/bags`, { bag_id: bagId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.tripBags(tripId) })
      qc.invalidateQueries({ queryKey: keys.bags() })
    },
  })
}

export const useUnassignBag = (tripId: number | string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bagId: number) => api.delete(`/trips/${tripId}/bags/${bagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tripBags(tripId) }),
  })
}

// ── Chat mutations ────────────────────────────────────────────────────────────

export const useCreateChatSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { trip_id: number }) => api.post<ChatSession>('/chat/sessions', data),
    onSuccess: (_session, vars) => {
      qc.invalidateQueries({ queryKey: keys.chatSessions(vars.trip_id) })
    },
  })
}

export const useDeleteChatSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number; tripId: number }) => api.delete(`/chat/sessions/${id}`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.chatSessions(vars.tripId) })
    },
  })
}

export const useClearChatMessages = (sessionId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/chat/sessions/${sessionId}/messages`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.chatMessages(sessionId) })
    },
  })
}

export const useSendChatMessage = () => {
  return useMutation({
    mutationFn: (data: { session_id: number; messages: { role: string; content: string }[] }) =>
      api.post<{
        reply: string
        suggestions: unknown[]
        history: ChatMessage[]
        session_title?: string
      }>('/chat', data),
  })
}

export const useLogChatContext = () => {
  return useMutation({
    mutationFn: (data: { session_id: number; content: string }) =>
      api.post('/chat/log', data),
  })
}

export const useAddBagItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bagId, data }: { bagId: number; tripId: number; data: { name: string; quantity: number; category_id?: number | null } }) =>
      api.post<{ id: number }>(`/bags/${bagId}/items`, data),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: keys.bagItems(vars.bagId) })
      qc.invalidateQueries({ queryKey: keys.tripBags(vars.tripId) })
    },
  })
}

export const useUpdateItem = () => {
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: Record<string, unknown> }) =>
      api.put(`/items/${itemId}`, data),
  })
}

export const useAddSubItem = () => {
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: { name: string; quantity: number } }) =>
      api.post(`/items/${itemId}/sub-items`, data),
  })
}

export const useCreateBagWithItems = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tripId, name, bagType, items }: { tripId: number; name: string; bagType: string; items: string[] }) => {
      const bag = await api.post<{ id: number }>('/bags', { name, type: bagType })
      await api.post(`/trips/${tripId}/bags`, { bag_id: bag.id })
      if (items.length > 0) {
        await Promise.all(items.map((itemName) => api.post(`/bags/${bag.id}/items`, { name: itemName, quantity: 1 })))
      }
      return bag
    },
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: keys.tripBags(vars.tripId) })
      qc.invalidateQueries({ queryKey: keys.bags() })
    },
  })
}
