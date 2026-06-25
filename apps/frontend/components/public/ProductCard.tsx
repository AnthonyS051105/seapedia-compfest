import Link from 'next/link'
import { Store as StoreIcon, ImageOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Product } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stock <= 0
  const image = product.images[0]

  return (
    <Link href={`/products/${product.id}`}>
      <Card variant="hover" className="flex h-full flex-col gap-3 p-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageOff className="h-8 w-8 text-text-sub" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <p className="line-clamp-2 text-sm font-medium text-text">{product.name}</p>
          <p className="flex items-center gap-1 text-xs text-text-sub">
            <StoreIcon className="h-3 w-3" />
            {product.store.name}
          </p>
          <div className="mt-auto flex items-center justify-between pt-1">
            <p className="font-semibold text-text">{formatRupiah(product.price)}</p>
            {isOutOfStock ? (
              <Badge variant="red">Habis</Badge>
            ) : (
              <span className="text-xs text-text-sub">Stok: {product.stock}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
