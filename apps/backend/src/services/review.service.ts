import { prisma } from '../prisma/client'
import { sanitizeText } from '../utils/sanitize'
import { CreateReviewDto } from '../schemas/review.schema'
import { PaginationMeta } from '../utils/response'

export interface ReviewItem {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: Date
}

export interface PaginationQuery {
  page: number
  limit: number
}

class ReviewService {
  async createReview(dto: CreateReviewDto): Promise<ReviewItem> {
    const review = await prisma.appReview.create({
      data: {
        reviewer_name: sanitizeText(dto.reviewer_name),
        rating: dto.rating,
        comment: sanitizeText(dto.comment),
      },
    })

    return {
      id: review.id,
      reviewer_name: review.reviewer_name,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
    }
  }

  async getReviews(query: PaginationQuery): Promise<{ data: ReviewItem[]; meta: PaginationMeta }> {
    const { page, limit } = query

    const [reviews, total] = await Promise.all([
      prisma.appReview.findMany({
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appReview.count(),
    ])

    return {
      data: reviews.map((r) => ({
        id: r.id,
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}

export const reviewService = new ReviewService()
