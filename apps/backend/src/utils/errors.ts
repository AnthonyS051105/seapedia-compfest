export interface FieldError {
  field: string
  message: string
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly errors?: FieldError[]
  public readonly data?: unknown

  constructor(message: string, statusCode: number, errors?: FieldError[], data?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.data = data
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, errors?: FieldError[]) {
    super(message, 400, errors)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, data?: unknown, errors?: FieldError[]) {
    super(message, 409, errors, data)
  }
}
