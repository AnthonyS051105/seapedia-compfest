'use client'

import { ReactNode } from 'react'
import { LayoutDashboard, Users, Store, ClipboardList, Truck, Tag, Megaphone, RotateCcw } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar, SidebarLink } from '@/components/layout/Sidebar'
import { useRequireRole } from '@/hooks/useRequireRole'

const LINKS: SidebarLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/stores', label: 'Toko', icon: Store },
  { href: '/admin/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/admin/delivery-jobs', label: 'Pengiriman', icon: Truck },
  { href: '/admin/vouchers', label: 'Voucher', icon: Tag },
  { href: '/admin/promos', label: 'Promo', icon: Megaphone },
  { href: '/admin/overdue', label: 'Overdue', icon: RotateCcw },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const isAuthorized = useRequireRole('ADMIN')

  if (!isAuthorized) {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-1">
        <Sidebar links={LINKS} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </>
  )
}
