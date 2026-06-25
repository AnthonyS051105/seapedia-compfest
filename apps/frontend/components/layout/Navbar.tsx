'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, ShoppingCart, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  SELLER: 'Seller',
  BUYER: 'Buyer',
  DRIVER: 'Driver',
}

export function Navbar() {
  const router = useRouter()
  const { user, activeRole, isAuthenticated, clearAuth } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold text-primary">
          SEAPEDIA
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/products" className="text-sm font-medium text-text hover:text-primary">
            Produk
          </Link>

          {isAuthenticated && user ? (
            <>
              <Link href="/buyer/cart" className="relative text-text hover:text-primary" aria-label="Keranjang">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                  0
                </span>
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-text hover:bg-gray-50"
                >
                  <span>{user.username}</span>
                  {activeRole && <Badge variant="blue">{ROLE_LABEL[activeRole]}</Badge>}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg"
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <Link
                      href="/auth/select-role"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-text hover:bg-gray-50"
                    >
                      Ganti Peran
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-gray-50"
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

        <button
          type="button"
          className="text-text md:hidden"
          aria-label="Menu"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-text">
              Produk
            </Link>

            {isAuthenticated && user ? (
              <>
                <Link href="/buyer/cart" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-text">
                  Keranjang
                </Link>
                <div className="flex items-center gap-2 text-sm text-text">
                  <span>{user.username}</span>
                  {activeRole && <Badge variant="blue">{ROLE_LABEL[activeRole]}</Badge>}
                </div>
                <Link href="/auth/select-role" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-text">
                  Ganti Peran
                </Link>
                <button type="button" onClick={handleLogout} className="text-left text-sm font-medium text-danger">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-text">
                  Masuk
                </Link>
                <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-primary">
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
