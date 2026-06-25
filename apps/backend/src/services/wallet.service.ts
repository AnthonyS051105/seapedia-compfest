import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { BadRequestError } from '../utils/errors'
import { PaginationMeta } from '../utils/response'

export interface WalletTransactionResult {
  id: string
  type: string
  amount: number
  description: string | null
  order_id: string | null
  created_at: Date
}

export interface WalletResult {
  balance: number
  transactions: WalletTransactionResult[]
  meta: PaginationMeta
}

interface WalletTransactionRow {
  id: string
  type: string
  amount: Prisma.Decimal
  description: string | null
  order_id: string | null
  created_at: Date
}

class WalletService {
  async getWallet(userId: string, query: { page: number; limit: number }): Promise<WalletResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const { page, limit } = query

    const where: Prisma.WalletTransactionWhereInput = { buyer_id: buyerProfile.id }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ])

    return {
      balance: Number(buyerProfile.balance),
      transactions: transactions.map((t) => this.toTransactionResult(t)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async topUp(userId: string, amount: number): Promise<{ balance: number; transaction: WalletTransactionResult }> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)

    const { updatedProfile, transaction } = await prisma.$transaction(async (tx) => {
      const updatedProfile = await tx.buyerProfile.update({
        where: { id: buyerProfile.id },
        data: { balance: { increment: amount } },
      })

      const transaction = await tx.walletTransaction.create({
        data: {
          buyer_id: buyerProfile.id,
          type: 'TOP_UP',
          amount,
          description: 'Top up saldo dompet',
        },
      })

      return { updatedProfile, transaction }
    })

    return {
      balance: Number(updatedProfile.balance),
      transaction: this.toTransactionResult(transaction),
    }
  }

  private async getBuyerProfileOrThrow(userId: string): Promise<{ id: string; balance: Prisma.Decimal }> {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { user_id: userId } })
    if (!buyerProfile) {
      throw new BadRequestError('Akun ini tidak memiliki profil pembeli')
    }
    return buyerProfile
  }

  private toTransactionResult(transaction: WalletTransactionRow): WalletTransactionResult {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.description,
      order_id: transaction.order_id,
      created_at: transaction.created_at,
    }
  }
}

export const walletService = new WalletService()
