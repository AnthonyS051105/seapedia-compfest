'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, ShoppingCart, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  SELLER: 'Seller',
  BUYER: 'Buyer',
  DRIVER: 'Driver',
}

export function Navbar() {
  const router = useRouter()
  const { user, activeRole, isAuthenticated, clearAuth } = useAuthStore()
  const { itemCount, refreshItemCount } = useCartStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (isAuthenticated && activeRole === 'BUYER') {
      refreshItemCount()
    }
  }, [isAuthenticated, activeRole, refreshItemCount])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network errors — clear local state regardless
    }
    clearAuth()
    setIsDropdownOpen(false)
    toast.success('Berhasil keluar')
    router.push('/')
  }

  const avatarInitial = user?.username?.charAt(0).toUpperCase() ?? '?'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b transition-all duration-200',
        isScrolled ? 'border-zinc-200/80 dark:border-zinc-800/80 shadow-sm' : 'border-transparent'
      )}
    >
      <nav className="container-page flex items-center justify-between h-16">
        <Link href="/" className="font-display font-bold text-xl tracking-tight shrink-0">
          <span className="text-brand-500">SEA</span>
          <span className="text-zinc-950 dark:text-zinc-50">PEDIA</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/products"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors px-3 py-1.5 rounded-md hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Produk
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <Link
                href="/buyer/cart"
                aria-label="Keranjang"
                className="relative p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors dark:hover:bg-zinc-800"
                >
                  <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center dark:bg-brand-500/10 dark:text-brand-400">
                    {avatarInitial}
                  </span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{user.username}</span>
                  {activeRole && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                      {ROLE_LABEL[activeRole]}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <Link
                      href="/auth/select-role"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Ganti Peran
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-zinc-50 dark:text-danger-500 dark:hover:bg-zinc-800"
                    >
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  Daftar
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          {isAuthenticated && (
            <Link
              href="/buyer/cart"
              aria-label="Keranjang"
              className="relative p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          <button
            type="button"
            className="p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
            aria-label="Menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-1">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-950 px-3 py-2 rounded-md hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Produk
            </Link>

            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center dark:bg-brand-500/10 dark:text-brand-400">
                    {avatarInitial}
                  </span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{user.username}</span>
                  {activeRole && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                      {ROLE_LABEL[activeRole]}
                    </span>
                  )}
                </div>
                <Link
                  href="/auth/select-role"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-950 px-3 py-2 rounded-md hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  Ganti Peran
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-sm font-medium text-danger-600 px-3 py-2 rounded-md hover:bg-zinc-50 dark:text-danger-500 dark:hover:bg-zinc-800"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-950 px-3 py-2 rounded-md hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-brand-600 px-3 py-2 rounded-md hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
