import { prisma } from '../prisma/client'
import { CreateAddressDto, UpdateAddressDto } from '../schemas/buyer.schema'
import { sanitizeText } from '../utils/sanitize'
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors'

export interface AddressResult {
  id: string
  label: string
  recipient_name: string
  phone: string
  street: string
  city: string
  province: string
  postal_code: string
  is_default: boolean
  created_at: Date
  updated_at: Date
}

interface AddressRow {
  id: string
  buyer_id: string
  label: string
  recipient_name: string
  phone: string
  street: string
  city: string
  province: string
  postal_code: string
  is_default: boolean
  created_at: Date
  updated_at: Date
}

class AddressService {
  async getAddresses(userId: string): Promise<AddressResult[]> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)

    const addresses = await prisma.deliveryAddress.findMany({
      where: { buyer_id: buyerProfile.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    })

    return addresses.map((a) => this.toAddressResult(a))
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<AddressResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)

    const address = await prisma.$transaction(async (tx) => {
      if (dto.is_default) {
        await tx.deliveryAddress.updateMany({
          where: { buyer_id: buyerProfile.id, is_default: true },
          data: { is_default: false },
        })
      }

      return tx.deliveryAddress.create({
        data: {
          buyer_id: buyerProfile.id,
          label: sanitizeText(dto.label),
          recipient_name: sanitizeText(dto.recipient_name),
          phone: dto.phone,
          street: sanitizeText(dto.street),
          city: sanitizeText(dto.city),
          province: sanitizeText(dto.province),
          postal_code: dto.postal_code,
          is_default: dto.is_default,
        },
      })
    })

    return this.toAddressResult(address)
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto): Promise<AddressResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const address = await this.getOwnedAddressOrThrow(buyerProfile.id, addressId)

    const updated = await prisma.$transaction(async (tx) => {
      if (dto.is_default === true) {
        await tx.deliveryAddress.updateMany({
          where: { buyer_id: buyerProfile.id, is_default: true, id: { not: address.id } },
          data: { is_default: false },
        })
      }

      return tx.deliveryAddress.update({
        where: { id: address.id },
        data: {
          ...(dto.label !== undefined ? { label: sanitizeText(dto.label) } : {}),
          ...(dto.recipient_name !== undefined ? { recipient_name: sanitizeText(dto.recipient_name) } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.street !== undefined ? { street: sanitizeText(dto.street) } : {}),
          ...(dto.city !== undefined ? { city: sanitizeText(dto.city) } : {}),
          ...(dto.province !== undefined ? { province: sanitizeText(dto.province) } : {}),
          ...(dto.postal_code !== undefined ? { postal_code: dto.postal_code } : {}),
          ...(dto.is_default !== undefined ? { is_default: dto.is_default } : {}),
        },
      })
    })

    return this.toAddressResult(updated)
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const address = await this.getOwnedAddressOrThrow(buyerProfile.id, addressId)

    const referencingOrder = await prisma.order.findFirst({ where: { address_id: address.id } })
    if (referencingOrder) {
      throw new ConflictError('Alamat tidak dapat dihapus karena sudah digunakan pada pesanan')
    }

    await prisma.deliveryAddress.delete({ where: { id: address.id } })
  }

  async setDefault(userId: string, addressId: string): Promise<AddressResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const address = await this.getOwnedAddressOrThrow(buyerProfile.id, addressId)

    const updated = await prisma.$transaction(async (tx) => {
      await tx.deliveryAddress.updateMany({
        where: { buyer_id: buyerProfile.id, is_default: true, id: { not: address.id } },
        data: { is_default: false },
      })

      return tx.deliveryAddress.update({
        where: { id: address.id },
        data: { is_default: true },
      })
    })

    return this.toAddressResult(updated)
  }

  private async getBuyerProfileOrThrow(userId: string): Promise<{ id: string }> {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { user_id: userId } })
    if (!buyerProfile) {
      throw new BadRequestError('Akun ini tidak memiliki profil pembeli')
    }
    return buyerProfile
  }

  private async getOwnedAddressOrThrow(buyerId: string, addressId: string): Promise<AddressRow> {
    const address = await prisma.deliveryAddress.findFirst({ where: { id: addressId, buyer_id: buyerId } })
    if (!address) {
      throw new NotFoundError('Alamat tidak ditemukan')
    }
    return address
  }

  private toAddressResult(address: AddressRow): AddressResult {
    return {
      id: address.id,
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      province: address.province,
      postal_code: address.postal_code,
      is_default: address.is_default,
      created_at: address.created_at,
      updated_at: address.updated_at,
    }
  }
}

export const addressService = new AddressService()
