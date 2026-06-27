'use client'

import { ReactNode } from 'react'
import { LayoutDashboard, Users, Store, ShoppingBag, Truck, AlertCircle, Tag, Percent } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar, SidebarLink } from '@/components/layout/Sidebar'
import { useRequireRole } from '@/hooks/useRequireRole'

const LINKS: SidebarLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users, section: 'Monitoring' },
  { href: '/admin/stores', label: 'Toko', icon: Store, section: 'Monitoring' },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag, section: 'Monitoring' },
  { href: '/admin/delivery-jobs', label: 'Pengiriman', icon: Truck, section: 'Monitoring' },
  { href: '/admin/overdue', label: 'Overdue', icon: AlertCircle, section: 'Monitoring' },
  { href: '/admin/vouchers', label: 'Voucher', icon: Tag, section: 'Diskon' },
  { href: '/admin/promos', label: 'Promo', icon: Percent, section: 'Diskon' },
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
