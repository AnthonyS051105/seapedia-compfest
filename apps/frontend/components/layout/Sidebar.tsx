'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarLink {
  href: string
  label: string
  icon: LucideIcon
}

export function Sidebar({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 flex-col gap-1 border-r border-border bg-surface p-4 md:flex">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-sub transition-colors hover:bg-gray-50 hover:text-text',
              isActive && 'bg-blue-50 text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </aside>
  )
}
