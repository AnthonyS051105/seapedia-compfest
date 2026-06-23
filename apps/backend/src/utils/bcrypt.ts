import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10)
  return bcrypt.hash(plain, rounds)
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}
