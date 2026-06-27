import { PrismaClient, Role, DiscountType, OrderStatus, DeliveryMethod, WalletTransactionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const BCRYPT_ROUNDS = 12

const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 15000,
  NEXT_DAY: 10000,
  REGULAR: 6000,
}

const PPN_RATE = 0.12
const DRIVER_EARNING_RATE = 0.8

function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

interface SeedOrderItem {
  product_id: string
  product_name: string
  product_price: number
  quantity: number
}

function calculateOrderPricing(items: SeedOrderItem[], deliveryMethod: DeliveryMethod) {
  const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0)
  const deliveryFee = DELIVERY_FEES[deliveryMethod]
  const taxBase = subtotal + deliveryFee
  const ppnAmount = Math.round(taxBase * PPN_RATE)
  const finalTotal = taxBase + ppnAmount
  return { subtotal, deliveryFee, ppnAmount, finalTotal }
}

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', BCRYPT_ROUNDS)
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@seapedia.com',
      password: adminPassword,
      full_name: 'Admin SEAPEDIA',
      user_roles: {
        create: [{ role: Role.ADMIN }],
      },
    },
  })

  const sellerPassword = await bcrypt.hash('Seller@123', BCRYPT_ROUNDS)
  const seller = await prisma.user.create({
    data: {
      username: 'seller1',
      email: 'seller1@seapedia.com',
      password: sellerPassword,
      full_name: 'Budi Santoso',
      user_roles: {
        create: [{ role: Role.SELLER }, { role: Role.BUYER }],
      },
      seller_profile: {
        create: {
          store: {
            create: {
              name: 'Toko Elektronik Maju',
              description: 'Menjual berbagai perangkat elektronik berkualitas dengan harga bersaing.',
              address: 'Jl. Elektronik Raya No. 5, Jakarta Barat',
              products: {
                create: [
                  {
                    name: 'Headphone Bluetooth Pro',
                    description: 'Headphone wireless dengan noise cancellation.',
                    price: 250000,
                    stock: 20,
                    images: [],
                  },
                  {
                    name: 'Power Bank 20000mAh',
                    description: 'Power bank fast charging kapasitas besar.',
                    price: 180000,
                    stock: 35,
                    images: [],
                  },
                  {
                    name: 'Keyboard Mechanical RGB',
                    description: 'Keyboard mechanical dengan lampu RGB customizable.',
                    price: 450000,
                    stock: 15,
                    images: [],
                  },
                  {
                    name: 'Mouse Wireless Ergonomic',
                    description: 'Mouse wireless dengan desain ergonomis.',
                    price: 120000,
                    stock: 40,
                    images: [],
                  },
                  {
                    name: 'Speaker Bluetooth Mini',
                    description: 'Speaker portable dengan suara jernih.',
                    price: 200000,
                    stock: 25,
                    images: [],
                  },
                ],
              },
            },
          },
        },
      },
    },
  })

  const buyerPassword = await bcrypt.hash('Buyer@123', BCRYPT_ROUNDS)
  const buyer = await prisma.user.create({
    data: {
      username: 'buyer1',
      email: 'buyer1@seapedia.com',
      password: buyerPassword,
      full_name: 'Andi Wijaya',
      user_roles: {
        create: [{ role: Role.BUYER }, { role: Role.DRIVER }],
      },
      buyer_profile: {
        create: {
          balance: 1_000_000,
          addresses: {
            create: [
              {
                label: 'Rumah',
                recipient_name: 'Andi Wijaya',
                phone: '081234567890',
                street: 'Jl. Merdeka No. 10',
                city: 'Jakarta Selatan',
                province: 'DKI Jakarta',
                postal_code: '12345',
                is_default: true,
              },
            ],
          },
        },
      },
      driver_profile: {
        create: {},
      },
    },
  })

  const driverPassword = await bcrypt.hash('Driver@123', BCRYPT_ROUNDS)
  const driver = await prisma.user.create({
    data: {
      username: 'driver1',
      email: 'driver1@seapedia.com',
      password: driverPassword,
      full_name: 'Cici Permata',
      user_roles: {
        create: [{ role: Role.DRIVER }],
      },
      driver_profile: {
        create: {},
      },
    },
  })

  const voucherHemat10 = await prisma.voucher.create({
    data: {
      code: 'HEMAT10',
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 10,
      max_usage: 100,
      current_usage: 0,
      expiry_date: daysFromNow(30),
    },
  })

  const voucherDisc50k = await prisma.voucher.create({
    data: {
      code: 'DISC50K',
      discount_type: DiscountType.FIXED_AMOUNT,
      discount_value: 50000,
      max_usage: 50,
      current_usage: 0,
      expiry_date: daysFromNow(30),
    },
  })

  const promo15 = await prisma.promo.create({
    data: {
      code: 'PROMO15',
      name: 'Promo Hemat 15%',
      description: 'Diskon 15% untuk semua pembelian.',
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 15,
      expiry_date: daysFromNow(30),
    },
  })

  const promoFlash25k = await prisma.promo.create({
    data: {
      code: 'FLASH25K',
      name: 'Flash Sale Rp25.000',
      description: 'Potongan langsung Rp 25.000.',
      discount_type: DiscountType.FIXED_AMOUNT,
      discount_value: 25000,
      expiry_date: daysFromNow(30),
    },
  })

  // =====================
  // DEMO ORDERS (for end-to-end dashboard demonstration)
  // =====================

  const sellerProfile = await prisma.sellerProfile.findUniqueOrThrow({ where: { user_id: seller.id } })
  const buyerProfile = await prisma.buyerProfile.findUniqueOrThrow({ where: { user_id: buyer.id } })
  const driverProfile = await prisma.driverProfile.findUniqueOrThrow({ where: { user_id: driver.id } })

  const store = await prisma.store.findUniqueOrThrow({ where: { seller_id: sellerProfile.id } })
  const products = await prisma.product.findMany({ where: { store_id: store.id }, orderBy: { created_at: 'asc' } })
  const [headphone, powerBank, keyboard] = products

  const buyerAddress = await prisma.deliveryAddress.findFirstOrThrow({ where: { buyer_id: buyerProfile.id } })

  // --- Order 1: Completed order (PESANAN_SELESAI) — demonstrates buyer order history + seller income ---
  const completedItems: SeedOrderItem[] = [
    { product_id: headphone.id, product_name: headphone.name, product_price: Number(headphone.price), quantity: 1 },
  ]
  const completedPricing = calculateOrderPricing(completedItems, DeliveryMethod.REGULAR)
  const completedCreatedAt = daysAgo(5)

  const completedOrder = await prisma.order.create({
    data: {
      buyer_id: buyerProfile.id,
      store_id: store.id,
      address_id: buyerAddress.id,
      delivery_method: DeliveryMethod.REGULAR,
      status: OrderStatus.PESANAN_SELESAI,
      subtotal: completedPricing.subtotal,
      delivery_fee: completedPricing.deliveryFee,
      ppn_amount: completedPricing.ppnAmount,
      final_total: completedPricing.finalTotal,
      created_at: completedCreatedAt,
      order_items: {
        create: completedItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          subtotal: item.product_price * item.quantity,
        })),
      },
      status_history: {
        create: [
          { status: OrderStatus.SEDANG_DIKEMAS, created_at: completedCreatedAt },
          { status: OrderStatus.MENUNGGU_PENGIRIM, created_at: daysAgo(4) },
          { status: OrderStatus.SEDANG_DIKIRIM, created_at: daysAgo(3) },
          { status: OrderStatus.PESANAN_SELESAI, created_at: daysAgo(2) },
        ],
      },
      delivery_job: {
        create: {
          driver_id: driverProfile.id,
          earning: DELIVERY_FEES.REGULAR * DRIVER_EARNING_RATE,
          taken_at: daysAgo(3),
          completed_at: daysAgo(2),
        },
      },
    },
  })

  await prisma.walletTransaction.create({
    data: {
      buyer_id: buyerProfile.id,
      type: WalletTransactionType.PAYMENT,
      amount: completedPricing.finalTotal,
      description: `Pembayaran pesanan #${completedOrder.id}`,
      order_id: completedOrder.id,
      created_at: completedCreatedAt,
    },
  })

  await prisma.driverProfile.update({
    where: { id: driverProfile.id },
    data: { total_earnings: { increment: DELIVERY_FEES.REGULAR * DRIVER_EARNING_RATE } },
  })

  await prisma.product.update({
    where: { id: headphone.id },
    data: { stock: { decrement: completedItems[0].quantity } },
  })

  // --- Order 2: In-progress order (SEDANG_DIKIRIM) — demonstrates active delivery for driver1 ---
  const inProgressItems: SeedOrderItem[] = [
    { product_id: powerBank.id, product_name: powerBank.name, product_price: Number(powerBank.price), quantity: 2 },
  ]
  const inProgressPricing = calculateOrderPricing(inProgressItems, DeliveryMethod.NEXT_DAY)
  const inProgressCreatedAt = daysAgo(1)

  const inProgressOrder = await prisma.order.create({
    data: {
      buyer_id: buyerProfile.id,
      store_id: store.id,
      address_id: buyerAddress.id,
      delivery_method: DeliveryMethod.NEXT_DAY,
      status: OrderStatus.SEDANG_DIKIRIM,
      subtotal: inProgressPricing.subtotal,
      delivery_fee: inProgressPricing.deliveryFee,
      ppn_amount: inProgressPricing.ppnAmount,
      final_total: inProgressPricing.finalTotal,
      created_at: inProgressCreatedAt,
      order_items: {
        create: inProgressItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          subtotal: item.product_price * item.quantity,
        })),
      },
      status_history: {
        create: [
          { status: OrderStatus.SEDANG_DIKEMAS, created_at: inProgressCreatedAt },
          { status: OrderStatus.MENUNGGU_PENGIRIM, note: 'Pesanan diproses penjual', created_at: daysAgo(1) },
          { status: OrderStatus.SEDANG_DIKIRIM, note: 'Driver assigned', created_at: new Date() },
        ],
      },
      delivery_job: {
        create: {
          driver_id: driverProfile.id,
          taken_at: new Date(),
        },
      },
    },
  })

  await prisma.walletTransaction.create({
    data: {
      buyer_id: buyerProfile.id,
      type: WalletTransactionType.PAYMENT,
      amount: inProgressPricing.finalTotal,
      description: `Pembayaran pesanan #${inProgressOrder.id}`,
      order_id: inProgressOrder.id,
      created_at: inProgressCreatedAt,
    },
  })

  await prisma.product.update({
    where: { id: powerBank.id },
    data: { stock: { decrement: inProgressItems[0].quantity } },
  })

  // --- Order 3: Returned/overdue order (DIKEMBALIKAN) — demonstrates overdue refund flow ---
  const returnedItems: SeedOrderItem[] = [
    { product_id: keyboard.id, product_name: keyboard.name, product_price: Number(keyboard.price), quantity: 1 },
  ]
  const returnedPricing = calculateOrderPricing(returnedItems, DeliveryMethod.REGULAR)
  const returnedCreatedAt = daysAgo(10)

  const returnedOrder = await prisma.order.create({
    data: {
      buyer_id: buyerProfile.id,
      store_id: store.id,
      address_id: buyerAddress.id,
      delivery_method: DeliveryMethod.REGULAR,
      status: OrderStatus.DIKEMBALIKAN,
      subtotal: returnedPricing.subtotal,
      delivery_fee: returnedPricing.deliveryFee,
      ppn_amount: returnedPricing.ppnAmount,
      final_total: returnedPricing.finalTotal,
      is_overdue_processed: true,
      created_at: returnedCreatedAt,
      order_items: {
        create: returnedItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          subtotal: item.product_price * item.quantity,
        })),
      },
      status_history: {
        create: [
          { status: OrderStatus.SEDANG_DIKEMAS, created_at: returnedCreatedAt },
          {
            status: OrderStatus.DIKEMBALIKAN,
            note: 'Auto-returned due to delivery SLA exceeded',
            created_at: daysAgo(6),
          },
        ],
      },
    },
  })

  // Stock was decremented at purchase time, then restored on refund (net zero, matches overdue.service.ts flow)
  await prisma.product.update({
    where: { id: keyboard.id },
    data: { stock: { decrement: returnedItems[0].quantity } },
  })

  await prisma.walletTransaction.create({
    data: {
      buyer_id: buyerProfile.id,
      type: WalletTransactionType.PAYMENT,
      amount: returnedPricing.finalTotal,
      description: `Pembayaran pesanan #${returnedOrder.id}`,
      order_id: returnedOrder.id,
      created_at: returnedCreatedAt,
    },
  })

  await prisma.walletTransaction.create({
    data: {
      buyer_id: buyerProfile.id,
      type: WalletTransactionType.REFUND,
      amount: returnedPricing.finalTotal,
      description: `Refund untuk pesanan overdue #${returnedOrder.id}`,
      order_id: returnedOrder.id,
      created_at: daysAgo(6),
    },
  })

  await prisma.product.update({
    where: { id: keyboard.id },
    data: { stock: { increment: returnedItems[0].quantity } },
  })

  // Deduct buyer wallet balance for the two payments that were NOT refunded
  // (the returned order's payment was refunded in full, net zero effect)
  await prisma.buyerProfile.update({
    where: { id: buyerProfile.id },
    data: {
      balance: { decrement: completedPricing.finalTotal + inProgressPricing.finalTotal },
    },
  })

  console.log('Seed completed:')
  console.log('  Users:', { admin: admin.username, seller: seller.username, buyer: buyer.username, driver: driver.username })
  console.log('  Vouchers:', [voucherHemat10.code, voucherDisc50k.code])
  console.log('  Promos:', [promo15.code, promoFlash25k.code])
  console.log('  Demo orders:', {
    completed: completedOrder.id,
    in_progress: inProgressOrder.id,
    returned: returnedOrder.id,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
