import crypto from 'crypto'

const PBKDF2_ITERATIONS = process.env.NODE_ENV === 'test' ? 1000 : 310000
const PBKDF2_KEY_LENGTH = 64
const PBKDF2_DIGEST = 'sha512' as const
const SALT_LENGTH = 16

export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex')
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST).toString('hex')
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const computedHash = hashPassword(password, salt)
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'))
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: '密码至少8位' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需要包含大写字母' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需要包含小写字母' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需要包含数字' }
  }
  return { valid: true }
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export function nowISO(): string {
  return new Date().toISOString()
}