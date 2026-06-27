'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarLink {
  href: string
  label: string
  icon: LucideIcon
  section?: string
}

function groupLinks(links: SidebarLink[]): { section?: string; items: SidebarLink[] }[] {
  const groups: { section?: string; items: SidebarLink[] }[] = []

  for (const link of links) {
    const last = groups[groups.length - 1]
    if (last && last.section === link.section) {
      last.items.push(link)
    } else {
      groups.push({ section: link.section, items: [link] })
    }
  }

  return groups
}

export function Sidebar({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname()
  const groups = groupLinks(links)

  return (
    <aside className="flex w-16 md:w-60 shrink-0 flex-col gap-1 border-r border-zinc-200 bg-white p-2 md:p-4">
      {groups.map((group, groupIndex) => (
        <div key={group.section ?? groupIndex}>
          {group.section && (
            <p className="hidden md:block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-2 mb-1 mt-4">
              {group.section}
            </p>
          )}
          {group.items.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            const Icon = link.icon

            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={cn(
                  'flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'relative font-semibold bg-brand-50 text-brand-700 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-4 before:bg-brand-500 before:rounded-full'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
