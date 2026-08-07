// License Plan Types
export type PlanType = 'basic' | 'pro' | 'enterprise';

export interface LicenseKey {
  id: string;
  key: string;            // The actual license key string
  plan: PlanType;
  shopName: string;        // Name of the shop this was issued to
  issuedTo: string;        // Phone or email
  issuedAt: string;
  expiresAt: string;
  isActive: boolean;
  maxUsers: number;
  notes: string;
}

export interface ActiveLicense {
  key: string;
  plan: PlanType;
  shopName: string;
  activatedAt: string;
  expiresAt: string;
  maxUsers: number;
}

// Features available per plan
export interface PlanFeatures {
  name: string;
  nameAr: string;
  maxUsers: number;
  maxProducts: number;
  maxIMEI: number;
  maxCustomers: number;
  modules: string[];       // Which page IDs are accessible
  hasFinance: boolean;
  hasIMEI: boolean;
  hasMaintenance: boolean;
  hasMultipleSafes: boolean;
  hasSuppliers: boolean;
  hasReports: boolean;
  hasBackup: boolean;
  hasDarkMode: boolean;
  price: string;
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  basic: {
    name: 'Basic',
    nameAr: 'أساسي',
    maxUsers: 2,
    maxProducts: 50,
    maxIMEI: 30,
    maxCustomers: 100,
    modules: ['dashboard', 'pos', 'inventory', 'customers', 'sales', 'settings'],
    hasFinance: false,
    hasIMEI: false,
    hasMaintenance: false,
    hasMultipleSafes: false,
    hasSuppliers: false,
    hasReports: false,
    hasBackup: false,
    hasDarkMode: false,
    price: 'مجاني',
  },
  pro: {
    name: 'Professional',
    nameAr: 'احترافي',
    maxUsers: 8,
    maxProducts: 500,
    maxIMEI: 300,
    maxCustomers: 1000,
    modules: ['dashboard', 'pos', 'inventory', 'imei', 'maintenance', 'customers', 'sales', 'safes', 'finance', 'suppliers', 'users', 'settings'],
    hasFinance: true,
    hasIMEI: true,
    hasMaintenance: true,
    hasMultipleSafes: true,
    hasSuppliers: true,
    hasReports: true,
    hasBackup: true,
    hasDarkMode: true,
    price: '499 ج.م/شهر',
  },
  enterprise: {
    name: 'Enterprise',
    nameAr: 'مؤسسي',
    maxUsers: 50,
    maxProducts: 99999,
    maxIMEI: 99999,
    maxCustomers: 99999,
    modules: ['dashboard', 'pos', 'inventory', 'imei', 'maintenance', 'customers', 'sales', 'safes', 'finance', 'suppliers', 'users', 'settings'],
    hasFinance: true,
    hasIMEI: true,
    hasMaintenance: true,
    hasMultipleSafes: true,
    hasSuppliers: true,
    hasReports: true,
    hasBackup: true,
    hasDarkMode: true,
    price: '999 ج.م/شهر',
  },
};
