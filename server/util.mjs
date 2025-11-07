import { randomBytes } from 'crypto';

export function createId(size = 16) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const bytes = randomBytes(size);
  let result = '';
  for (let i = 0; i < size; i += 1) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
