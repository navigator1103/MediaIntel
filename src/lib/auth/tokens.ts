import crypto from 'crypto';

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateVerificationToken(): string {
  return generateSecureToken(32);
}

export function generatePasswordResetToken(): string {
  return generateSecureToken(32);
}

export function getTokenExpiryDate(hours: number = 1): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}