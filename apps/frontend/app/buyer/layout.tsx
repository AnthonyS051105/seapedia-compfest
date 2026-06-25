'use client'

import { ReactNode } from 'react'
import { LayoutDashboard, Wallet, ShoppingCart, Package, MapPin, FileBarChart } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar, SidebarLink } from '@/components/layout/Sidebar'
import { useRequireRole } from '@/hooks/useRequireRole'

const LINKS: SidebarLink[] = [
  { href: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/buyer/wallet', label: 'Dompet', icon: Wallet },
  { href: '/buyer/cart', label: 'Keranjang', icon: ShoppingCart },
  { href: '/buyer/orders', label: 'Pesanan', icon: Package },
  { href: '/buyer/addresses', label: 'Alamat', icon: MapPin },
  { href: '/buyer/reports', label: 'Laporan', icon: FileBarChart },
]

export default function BuyerLayout({ children }: { children: ReactNode }) {
  const isAuthorized = useRequireRole('BUYER')

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
