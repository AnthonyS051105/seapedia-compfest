import { PrismaClient, Role, DiscountType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const BCRYPT_ROUNDS = 12

function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
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

  console.log('Seed completed:')
  console.log('  Users:', { admin: admin.username, seller: seller.username, buyer: buyer.username, driver: driver.username })
  console.log('  Vouchers:', [voucherHemat10.code, voucherDisc50k.code])
  console.log('  Promos:', [promo15.code, promoFlash25k.code])
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
