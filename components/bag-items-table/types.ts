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
