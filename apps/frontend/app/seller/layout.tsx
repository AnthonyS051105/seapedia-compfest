'use client'

import { ReactNode } from 'react'
import { LayoutDashboard, Store, Package, ClipboardList, FileBarChart } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar, SidebarLink } from '@/components/layout/Sidebar'
import { useRequireRole } from '@/hooks/useRequireRole'

const LINKS: SidebarLink[] = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/store', label: 'Toko', icon: Store },
  { href: '/seller/products', label: 'Produk', icon: Package },
  { href: '/seller/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/seller/reports', label: 'Laporan', icon: FileBarChart },
]

export default function SellerLayout({ children }: { children: ReactNode }) {
  const isAuthorized = useRequireRole('SELLER')

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
