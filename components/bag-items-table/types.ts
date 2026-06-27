export type { Category, Item, SubItem } from '@/lib/queries'

export interface RowDraft {
  id: number
  name: string
  quantity: number
  packed: boolean
  category_id: number | null
  deleted?: boolean
}

export interface SubDraft {
  id: number
  item_id: number
  name: string
  quantity: number
  packed: boolean
  deleted?: boolean
}
