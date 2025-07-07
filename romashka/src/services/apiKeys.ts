import crypto from 'crypto';

const ALGO = 'aes-256-ctr';
const IV_LENGTH = 16;

export function encryptApiKey(apiKey: string, secret: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(secret).digest();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const crypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + crypted.toString('hex');
}

export function decryptApiKey(encrypted: string, secret: string) {
  const [ivHex, cryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  const dec = Buffer.concat([
    decipher.update(Buffer.from(cryptedHex, 'hex')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

export function rotateApiKey() {
  return crypto.randomBytes(32).toString('hex');
} 