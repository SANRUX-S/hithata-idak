import crypto from "crypto";

// Server encryption key derived from environment or secure deterministic fallback
const ENCRYPTION_SECRET = process.env.CHAT_ENCRYPTION_SECRET || "hithata-idak-emotional-support-safe-key-2026-secure-random";
const KEY_BUFFER = crypto.scryptSync(ENCRYPTION_SECRET, "hithata-idak-salt-2026", 32);

// Non-confusing characters for human-readable ticket references (no 0/O, 1/I)
const REF_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates an unpredictable, non-sequential ticket reference: HID-XXXXXX
 * Example: HID-7F2K9M
 */
export function generateTicketReference(): string {
  const bytes = crypto.randomBytes(6);
  let result = "HID-";
  for (let i = 0; i < 6; i++) {
    result += REF_CHARS[bytes[i] % REF_CHARS.length];
  }
  return result;
}

/**
 * Generates a high-entropy private recovery credential shown ONCE to the visitor.
 * Example: REC-4K7Y-8M2N-9Q1Z
 */
export function generateRecoveryCode(): string {
  const bytes = crypto.randomBytes(12);
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += REF_CHARS[bytes[i] % REF_CHARS.length];
  }
  return `REC-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

/**
 * Hashes the private recovery code using HMAC-SHA256 with a unique salt.
 * The plaintext code is NEVER stored in the database.
 */
export function hashRecoveryCode(code: string, salt: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return crypto.createHmac("sha256", salt).update(normalized).digest("hex");
}

/**
 * Timing-safe verification of a user-provided recovery code.
 */
export function verifyRecoveryCode(providedCode: string, salt: string, storedHash: string): boolean {
  try {
    const computedHash = hashRecoveryCode(providedCode, salt);
    const computedBuf = Buffer.from(computedHash, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    if (computedBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Encrypts conversation message text using AES-256-GCM.
 * Message content is never stored in plaintext in the database or logs.
 */
export function encryptMessage(text: string): { ciphertext: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY_BUFFER, iv);
  let ciphertext = cipher.update(text, "utf8", "base64");
  ciphertext += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");
  return {
    ciphertext,
    iv: iv.toString("base64"),
    authTag,
  };
}

/**
 * Decrypts conversation message text using AES-256-GCM.
 */
export function decryptMessage(ciphertext: string, ivBase64: string, authTagBase64: string): string {
  try {
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY_BUFFER, iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "[Encrypted message content unavailable]";
  }
}

/**
 * Generates a crypto-secure session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Password hashing for supporters/administrators using scrypt.
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const effectiveSalt = salt || crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, effectiveSalt, 64);
  return {
    hash: derivedKey.toString("hex"),
    salt: effectiveSalt,
  };
}

/**
 * Timing-safe password verification.
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(derivedKey.toString("hex"), "hex");
    const expBuf = Buffer.from(expectedHash, "hex");
    if (keyBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, expBuf);
  } catch {
    return false;
  }
}

