export type Role = 'ADMIN' | 'SELLER' | 'BUYER' | 'DRIVER'

export type OrderStatus =
  | 'SEDANG_DIKEMAS'
  | 'MENUNGGU_PENGIRIM'
  | 'SEDANG_DIKIRIM'
  | 'PESANAN_SELESAI'
  | 'DIKEMBALIKAN'

export type DeliveryMethod = 'INSTANT' | 'NEXT_DAY' | 'REGULAR'

export type WalletTransactionType = 'TOP_UP' | 'PAYMENT' | 'REFUND'

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export interface User {
  id: string
  username: string
  email: string
  full_name: string | null
  phone: string | null
  roles: Role[]
  active_role: Role | null
  wallet_balance: number | null
  seller_income: number | null
  driver_earnings: number | null
}

export interface Store {
  id: string
  seller_id: string
  name: string
  description: string | null
  address: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  store_id: string
  name: string
  description: string | null
  price: number
  stock: number
  images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  store?: Pick<Store, 'id' | 'name' | 'seller_id'>
}

export interface CartItem {
  id: string
  buyer_id: string
  product_id: string
  quantity: number
  product: Product
}

export interface DeliveryAddress {
  id: string
  buyer_id: string
  label: string
  recipient_name: string
  phone: string
  street: string
  city: string
  province: string
  postal_code: string
  is_default: boolean
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
}

export interface OrderStatusHistoryEntry {
  id: string
  order_id: string
  status: OrderStatus
  note: string | null
  created_at: string
}

export interface Order {
  id: string
  buyer_id: string
  store_id: string
  address_id: string
  delivery_method: DeliveryMethod
  status: OrderStatus
  subtotal: number
  discount_amount: number
  delivery_fee: number
  ppn_amount: number
  final_total: number
  discount_code: string | null
  discount_type: string | null
  is_overdue_processed: boolean
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  status_history?: OrderStatusHistoryEntry[]
}

export interface DeliveryJob {
  id: string
  order_id: string
  driver_id: string | null
  earning: number | null
  taken_at: string | null
  completed_at: string | null
  created_at: string
  order?: Order
}

export interface Voucher {
  id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  max_discount_amount: number | null
  min_order_amount: number | null
  expiry_date: string
  max_usage: number
  current_usage: number
  is_active: boolean
}

export interface Promo {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  max_discount_amount: number | null
  min_order_amount: number | null
  expiry_date: string
  is_active: boolean
}

export interface WalletTransaction {
  id: string
  buyer_id: string
  type: WalletTransactionType
  amount: number
  description: string | null
  order_id: string | null
  created_at: string
}

export interface FieldError {
  field: string
  message: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: FieldError[]
}
