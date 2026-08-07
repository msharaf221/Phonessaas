// Types for Mobile Shop Management System

// User & Auth Types
export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  createdAt: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  type: 'device' | 'accessory' | 'spare_part';
}

// Inventory Types (Product Templates)
export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  barcode: string;
  categoryId: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  minQuantity: number;
  hasIMEI: boolean;
  createdAt: string;
}

// IMEI Unit Types (Individual Devices)
export interface IMEIUnit {
  id: string;
  inventoryId: string;
  imei1: string;
  imei2: string;
  color: string;
  storage: string;
  ram: string;
  condition: 'new' | 'used' | 'refurbished';
  warrantyEndDate: string;
  status: 'available' | 'sold' | 'returned' | 'maintenance' | 'wasted';
  saleId: string;
  customerId: string;
  purchasePrice: number;
  notes: string;
  createdAt: string;
}

// Sale Types
export interface SaleItem {
  id: string;
  inventoryId: string;
  imeiUnitId?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
  returnedQuantity: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'installment';
  cashierId: string;
  safeId: string;
  notes: string;
  createdAt: string;
}

// Sale Return Types
export interface SaleReturn {
  id: string;
  saleId: string;
  saleItemId: string;
  inventoryId: string;
  imeiUnitId?: string;
  quantity: number;
  refundAmount: number;
  reason: string;
  createdAt: string;
  processedBy: string;
}

// Maintenance Types
export interface MaintenancePart {
  id: string;
  inventoryId: string;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Maintenance {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  deviceModel: string;
  imeiLink: string;
  problem: string;
  diagnosis: string;
  status: 'received' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  estimatedCost: number;
  finalCost: number;
  collectedAmount: number;
  parts: MaintenancePart[];
  additionalExpenses: number;
  profit: number;
  technicianId: string;
  safeId: string;
  receivedAt: string;
  completedAt: string;
  deliveredAt: string;
  notes: string;
}

// Safe/Cash Register Types
export interface Safe {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
}

// Transaction Types
export interface Transaction {
  id: string;
  type: 'sale' | 'purchase' | 'maintenance' | 'expense' | 'income' | 'transfer' | 'return' | 'waste';
  amount: number;
  description: string;
  referenceId: string;
  safeId: string;
  userId: string;
  createdAt: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

// Waste / Scrap Types
export interface StockWaste {
  id: string;
  inventoryId: string;
  supplierId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reason: string;
  notes: string;
  createdAt: string;
  userId: string;
}

// Purchase Types
export interface PurchaseItem {
  id: string;
  inventoryId: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  items: PurchaseItem[];
  total: number;
  paid: number;
  remaining: number;
  safeId: string;
  userId: string;
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'low_stock' | 'warranty_expiring' | 'maintenance_delayed' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// App State Types
export interface AppState {
  currentUser: User | null;
  isDarkMode: boolean;
  sidebarCollapsed: boolean;
}

// Persistent app settings
export interface AppSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  receiptFooter: string;
  notifSound: boolean;
  autoRefresh: boolean;
}
