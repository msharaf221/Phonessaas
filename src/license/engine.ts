import { LicenseKey, ActiveLicense, PlanType, PLAN_FEATURES } from './types';

// ===== MASTER KEY — Only YOU know this =====
const MASTER_SECRET = 'MSP2025-XKEY-ULTRA-SECRET';
const MASTER_PASSWORD = 'Muhamed@3512139M';

// ===== Simple hash for key generation =====
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

function encodeData(data: string): string {
  // Simple Base64-like encoding
  try {
    return btoa(unescape(encodeURIComponent(data)));
  } catch {
    return btoa(data);
  }
}

function decodeData(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    try { return atob(encoded); } catch { return ''; }
  }
}

// ===== Generate a License Key =====
export function generateLicenseKey(
  plan: PlanType,
  shopName: string,
  issuedTo: string,
  durationDays: number,
  maxUsers: number,
  notes: string = ''
): LicenseKey {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Build key payload
  const payload = {
    id,
    p: plan,
    s: shopName,
    e: expiresAt.toISOString(),
    u: maxUsers,
    t: now.getTime()
  };

  const payloadStr = JSON.stringify(payload);
  const encoded = encodeData(payloadStr);
  const checksum = simpleHash(encoded + MASTER_SECRET);

  // Format: MSP-{PLAN_PREFIX}-{ENCODED}-{CHECKSUM}
  const planPrefix = plan === 'basic' ? 'BSC' : plan === 'pro' ? 'PRO' : 'ENT';
  const keyStr = `MSP-${planPrefix}-${encoded.substring(0, 20)}-${checksum}`;

  // Store full encoded data separately
  const fullKey = `${keyStr}|${encoded}`;

  return {
    id,
    key: fullKey,
    plan,
    shopName,
    issuedTo,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isActive: true,
    maxUsers,
    notes
  };
}

// ===== Validate & Decode a License Key =====
export function validateLicenseKey(fullKey: string): {
  valid: boolean;
  license?: ActiveLicense;
  error?: string;
} {
  try {
    const parts = fullKey.split('|');
    if (parts.length !== 2) {
      return { valid: false, error: 'مفتاح غير صالح' };
    }

    const [keyHeader, encoded] = parts;
    
    // Verify header format
    if (!keyHeader.startsWith('MSP-')) {
      return { valid: false, error: 'مفتاح غير صالح' };
    }

    // Verify checksum
    const headerParts = keyHeader.split('-');
    if (headerParts.length !== 4) {
      return { valid: false, error: 'مفتاح غير صالح' };
    }

    const checksum = headerParts[3];
    const expectedChecksum = simpleHash(encoded + MASTER_SECRET);

    if (checksum !== expectedChecksum) {
      return { valid: false, error: 'مفتاح مزور أو معدّل' };
    }

    // Decode payload
    const payloadStr = decodeData(encoded);
    if (!payloadStr) {
      return { valid: false, error: 'خطأ في فك التشفير' };
    }

    const payload = JSON.parse(payloadStr);

    // Check expiration
    const expiresAt = new Date(payload.e);
    if (expiresAt < new Date()) {
      return { valid: false, error: 'المفتاح منتهي الصلاحية' };
    }

    // Valid!
    return {
      valid: true,
      license: {
        key: fullKey,
        plan: payload.p as PlanType,
        shopName: payload.s,
        activatedAt: new Date().toISOString(),
        expiresAt: payload.e,
        maxUsers: payload.u || PLAN_FEATURES[payload.p as PlanType].maxUsers
      }
    };
  } catch {
    return { valid: false, error: 'مفتاح غير صالح' };
  }
}

// ===== Check if module is available in plan =====
export function isModuleAvailable(plan: PlanType, moduleId: string): boolean {
  return PLAN_FEATURES[plan].modules.includes(moduleId);
}

// ===== Get days remaining =====
export function getDaysRemaining(expiresAt: string): number {
  const exp = new Date(expiresAt);
  const now = new Date();
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ===== Check if license is expired =====
export function isLicenseExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

// ===== Master Admin Auth =====
export function verifyMasterPassword(password: string): boolean {
  return password === MASTER_PASSWORD;
}

// ===== Storage helpers for active license =====
const LICENSE_STORAGE_KEY = 'msp_active_license';
const MASTER_KEYS_STORAGE = 'msp_master_keys';

export function getStoredLicense(includeExpired = false): ActiveLicense | null {
  try {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!stored) return null;
    const license = JSON.parse(decodeData(stored)) as ActiveLicense;
    // Re-validate expiration
    if (!includeExpired && isLicenseExpired(license.expiresAt)) {
      return null; // Expired
    }
    return license;
  } catch {
    return null;
  }
}

export function storeLicense(license: ActiveLicense): void {
  localStorage.setItem(LICENSE_STORAGE_KEY, encodeData(JSON.stringify(license)));
}

export function clearLicense(): void {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
}

// Master keys storage
export function getStoredMasterKeys(): LicenseKey[] {
  try {
    const stored = localStorage.getItem(MASTER_KEYS_STORAGE);
    if (!stored) return [];
    return JSON.parse(decodeData(stored));
  } catch {
    return [];
  }
}

export function storeMasterKeys(keys: LicenseKey[]): void {
  localStorage.setItem(MASTER_KEYS_STORAGE, encodeData(JSON.stringify(keys)));
}
