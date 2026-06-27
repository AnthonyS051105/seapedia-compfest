'use client'

import { ReactNode } from 'react'
import { LayoutDashboard, Truck, History, Banknote } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar, SidebarLink } from '@/components/layout/Sidebar'
import { useRequireRole } from '@/hooks/useRequireRole'

const LINKS: SidebarLink[] = [
  { href: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/driver/jobs', label: 'Pekerjaan', icon: Truck },
  { href: '/driver/jobs/history', label: 'Riwayat', icon: History },
  { href: '/driver/earnings', label: 'Pendapatan', icon: Banknote },
]

export default function DriverLayout({ children }: { children: ReactNode }) {
  const isAuthorized = useRequireRole('DRIVER')

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
