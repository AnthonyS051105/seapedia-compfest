import { create } from 'zustand'
import { api } from '@/lib/api'
import { ApiResponse, CartSummary } from '@/types'

interface CartState {
  itemCount: number
  setItemCount: (count: number) => void
  refreshItemCount: () => Promise<void>
}

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,

  setItemCount: (count) => set({ itemCount: count }),

  refreshItemCount: async () => {
    try {
      const { data } = await api.get<ApiResponse<CartSummary>>('/buyer/cart')
      set({ itemCount: data.data.items.length })
    } catch {
      set({ itemCount: 0 })
    }
  },
}))
