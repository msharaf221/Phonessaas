import { useCallback, useMemo } from 'react';
import { useIndexedDB, useIndexedDBSetting, indexedDBUtils } from './useIndexedDB';
import { v4 as uuidv4 } from 'uuid';
import {
  User, Customer, Category, InventoryItem, IMEIUnit,
  Sale, SaleItem, SaleReturn, Maintenance, MaintenancePart, Safe, Transaction, Supplier, Notification,
  StockWaste, AppSettings
} from '../types';
import {
  initialUsers, initialCustomers, initialCategories, initialInventory,
  initialIMEIUnits, initialSales, initialSaleReturns, initialMaintenance, initialSafes,
  initialTransactions, initialSuppliers, initialStockWastes, initialNotifications
} from '../data/initialData';

const defaultAppSettings: AppSettings = {
  shopName: 'موبايل شوب',
  shopPhone: '01000000000',
  shopAddress: 'القاهرة - مصر',
  receiptFooter: 'شكراً لتعاملكم معنا 💙',
  notifSound: true,
  autoRefresh: true
};

// Main store hook
export function useStore() {
  // State using IndexedDB
  const [users, setUsers, usersLoading] = useIndexedDB<User>('users', initialUsers);
  const [customers, setCustomers, customersLoading] = useIndexedDB<Customer>('customers', initialCustomers);
  const [categories, setCategories, categoriesLoading] = useIndexedDB<Category>('categories', initialCategories);
  const [inventory, setInventory, inventoryLoading] = useIndexedDB<InventoryItem>('inventory', initialInventory);
  const [imeiUnits, setImeiUnits, imeiLoading] = useIndexedDB<IMEIUnit>('imeiUnits', initialIMEIUnits);
  const [sales, setSales, salesLoading] = useIndexedDB<Sale>('sales', initialSales);
  const [saleReturns, setSaleReturns, saleReturnsLoading] = useIndexedDB<SaleReturn>('saleReturns', initialSaleReturns);
  const [maintenance, setMaintenance, maintenanceLoading] = useIndexedDB<Maintenance>('maintenance', initialMaintenance);
  const [safes, setSafes, safesLoading] = useIndexedDB<Safe>('safes', initialSafes);
  const [transactions, setTransactions, transactionsLoading] = useIndexedDB<Transaction>('transactions', initialTransactions);
  const [suppliers, setSuppliers, suppliersLoading] = useIndexedDB<Supplier>('suppliers', initialSuppliers);
  const [stockWastes, setStockWastes, stockWastesLoading] = useIndexedDB<StockWaste>('stockWastes', initialStockWastes);
  const [notifications, setNotifications, notificationsLoading] = useIndexedDB<Notification>('notifications', initialNotifications);
  
  // Settings
  const [currentUser, setCurrentUser, userLoading] = useIndexedDBSetting<User | null>('currentUser', null);
  const [isDarkMode, setIsDarkMode, darkModeLoading] = useIndexedDBSetting<boolean>('darkMode', false);
  const [appSettings, setAppSettings, appSettingsLoading] = useIndexedDBSetting<AppSettings>('shopSettings', defaultAppSettings);

  // Loading state
  const isLoading = usersLoading || customersLoading || categoriesLoading || 
    inventoryLoading || imeiLoading || salesLoading || maintenanceLoading ||
    saleReturnsLoading || safesLoading || transactionsLoading || suppliersLoading || stockWastesLoading || notificationsLoading ||
    userLoading || darkModeLoading || appSettingsLoading;

  // Auth functions
  const login = useCallback((username: string, password: string): User | null => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return user;
    }
    return null;
  }, [users, setCurrentUser]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  // Customer functions
  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, [setCustomers]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [setCustomers]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, [setCustomers]);

  // Category functions
  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...category, id: uuidv4() };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, [setCategories]);

  // Inventory functions
  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    setInventory(prev => [...prev, newItem]);
    return newItem;
  }, [setInventory]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, [setInventory]);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  }, [setInventory]);

  // IMEI functions
  const addIMEIUnit = useCallback((unit: Omit<IMEIUnit, 'id' | 'createdAt'>) => {
    const newUnit: IMEIUnit = {
      ...unit,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    setImeiUnits(prev => [...prev, newUnit]);
    return newUnit;
  }, [setImeiUnits]);

  const updateIMEIUnit = useCallback((id: string, updates: Partial<IMEIUnit>) => {
    setImeiUnits(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, [setImeiUnits]);

  const deleteIMEIUnit = useCallback((id: string) => {
    setImeiUnits(prev => prev.filter(u => u.id !== id));
  }, [setImeiUnits]);

  const findIMEIByNumber = useCallback((imei: string) => {
    return imeiUnits.find(u => u.imei1 === imei || u.imei2 === imei);
  }, [imeiUnits]);

  const getIMEIHistory = useCallback((imei: string) => {
    const unit = imeiUnits.find(u => u.imei1 === imei || u.imei2 === imei);
    if (!unit) return null;
    
    const relatedSales = sales.filter(s => s.items.some(i => i.imeiUnitId === unit.id));
    const relatedMaintenance = maintenance.filter(m => m.imeiLink === imei);
    
    return {
      unit,
      sales: relatedSales,
      maintenance: relatedMaintenance
    };
  }, [imeiUnits, sales, maintenance]);

  // Sales functions
  const generateInvoiceNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = sales.filter(s => s.invoiceNumber.includes(year.toString())).length + 1;
    return `INV-${year}-${count.toString().padStart(4, '0')}`;
  }, [sales]);

  const createSale = useCallback((
    customerId: string,
    items: Omit<SaleItem, 'id' | 'returnedQuantity'>[],
    discount: number,
    paymentMethod: 'cash' | 'card' | 'installment',
    safeId: string,
    notes: string
  ) => {
    const saleItems: SaleItem[] = items.map(item => ({
      ...item,
      returnedQuantity: 0,
      id: uuidv4()
    }));

    const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - discount;
    const profit = saleItems.reduce((sum, item) => sum + (item.total - (item.costPrice * item.quantity)), 0) - discount;

    const newSale: Sale = {
      id: uuidv4(),
      invoiceNumber: generateInvoiceNumber(),
      customerId,
      items: saleItems,
      subtotal,
      discount,
      total,
      profit,
      paymentMethod,
      cashierId: currentUser?.id || '',
      safeId,
      notes,
      createdAt: new Date().toISOString()
    };

    // Update IMEI units status
    saleItems.forEach(item => {
      if (item.imeiUnitId) {
        updateIMEIUnit(item.imeiUnitId, {
          status: 'sold',
          saleId: newSale.id,
          customerId
        });
      }
    });

    // Update inventory quantities for non-IMEI items (group by product to avoid race conditions)
    const quantitiesToDeduct: Record<string, number> = {};
    saleItems.forEach(item => {
      if (!item.imeiUnitId) {
        quantitiesToDeduct[item.inventoryId] = (quantitiesToDeduct[item.inventoryId] || 0) + item.quantity;
      }
    });
    setInventory(prev => prev.map(inv => {
      const deduct = quantitiesToDeduct[inv.id];
      return deduct ? { ...inv, quantity: Math.max(0, inv.quantity - deduct) } : inv;
    }));

    // Update safe balance
    setSafes(prev => prev.map(s => 
      s.id === safeId ? { ...s, balance: s.balance + total } : s
    ));

    // Add transaction
    const transaction: Transaction = {
      id: uuidv4(),
      type: 'sale',
      amount: total,
      description: `فاتورة بيع ${newSale.invoiceNumber}`,
      referenceId: newSale.id,
      safeId,
      userId: currentUser?.id || '',
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [...prev, transaction]);

    setSales(prev => [...prev, newSale]);
    return newSale;
  }, [currentUser, generateInvoiceNumber, inventory, updateIMEIUnit, setInventory, setSafes, setTransactions, setSales]);

  const processSaleReturn = useCallback((
    saleId: string,
    saleItemId: string,
    quantity: number,
    reason: string
  ) => {
    const sale = sales.find(s => s.id === saleId);
    const saleItem = sale?.items.find(item => item.id === saleItemId);
    if (!sale || !saleItem) return null;

    const alreadyReturned = saleItem.returnedQuantity || 0;
    const returnableQuantity = saleItem.quantity - alreadyReturned;
    if (quantity <= 0 || quantity > returnableQuantity) return null;

    const refundAmount = (saleItem.total / saleItem.quantity) * quantity;
    const now = new Date().toISOString();
    const returnRecord: SaleReturn = {
      id: uuidv4(),
      saleId,
      saleItemId,
      inventoryId: saleItem.inventoryId,
      imeiUnitId: saleItem.imeiUnitId,
      quantity,
      refundAmount,
      reason,
      createdAt: now,
      processedBy: currentUser?.id || ''
    };

    setSaleReturns(prev => [...prev, returnRecord]);

    setSales(prev => prev.map(s => {
      if (s.id !== saleId) return s;
      return {
        ...s,
        items: s.items.map(item =>
          item.id === saleItemId
            ? { ...item, returnedQuantity: (item.returnedQuantity || 0) + quantity }
            : item
        )
      };
    }));

    if (saleItem.imeiUnitId) {
      updateIMEIUnit(saleItem.imeiUnitId, {
        status: 'available',
        saleId: '',
        customerId: ''
      });
    } else {
      setInventory(prev => prev.map(inv =>
        inv.id === saleItem.inventoryId
          ? { ...inv, quantity: inv.quantity + quantity }
          : inv
      ));
    }

    setSafes(prev => prev.map(s =>
      s.id === sale.safeId ? { ...s, balance: s.balance - refundAmount } : s
    ));

    const transaction: Transaction = {
      id: uuidv4(),
      type: 'return',
      amount: -refundAmount,
      description: `مرتجع ${sale.invoiceNumber}`,
      referenceId: returnRecord.id,
      safeId: sale.safeId,
      userId: currentUser?.id || '',
      createdAt: now
    };
    setTransactions(prev => [...prev, transaction]);

    return returnRecord;
  }, [currentUser, sales, setSaleReturns, setSales, updateIMEIUnit, setInventory, setSafes, setTransactions]);

  const recordStockWaste = useCallback((
    inventoryId: string,
    quantity: number,
    supplierId: string,
    reason: string,
    notes: string
  ) => {
    const item = inventory.find(inv => inv.id === inventoryId);
    if (!item || quantity <= 0) return null;

    if (item.hasIMEI) {
      const availableUnits = imeiUnits
        .filter(unit => unit.inventoryId === inventoryId && unit.status === 'available')
        .slice(0, quantity);

      if (availableUnits.length !== quantity) return null;

      availableUnits.forEach(unit => {
        updateIMEIUnit(unit.id, {
          status: 'wasted',
          saleId: '',
          customerId: '',
          notes: notes || unit.notes
        });
      });
    } else {
      if (item.quantity < quantity) return null;

      setInventory(prev => prev.map(inv =>
        inv.id === inventoryId
          ? { ...inv, quantity: inv.quantity - quantity }
          : inv
      ));
    }

    const totalCost = item.costPrice * quantity;
    const wasteRecord: StockWaste = {
      id: uuidv4(),
      inventoryId,
      supplierId,
      quantity,
      unitCost: item.costPrice,
      totalCost,
      reason,
      notes,
      createdAt: new Date().toISOString(),
      userId: currentUser?.id || ''
    };
    setStockWastes(prev => [...prev, wasteRecord]);

    return wasteRecord;
  }, [currentUser, imeiUnits, inventory, setInventory, setStockWastes, updateIMEIUnit]);

  // Maintenance functions
  const generateTicketNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = maintenance.filter(m => m.ticketNumber.includes(year.toString())).length + 1;
    return `MNT-${year}-${count.toString().padStart(3, '0')}`;
  }, [maintenance]);

  const createMaintenance = useCallback((data: Omit<Maintenance, 'id' | 'ticketNumber' | 'status' | 'finalCost' | 'collectedAmount' | 'parts' | 'additionalExpenses' | 'profit' | 'completedAt' | 'deliveredAt'>) => {
    const newMaintenance: Maintenance = {
      ...data,
      id: uuidv4(),
      ticketNumber: generateTicketNumber(),
      status: 'received',
      finalCost: 0,
      collectedAmount: 0,
      parts: [],
      additionalExpenses: 0,
      profit: 0,
      completedAt: '',
      deliveredAt: ''
    };
    setMaintenance(prev => [...prev, newMaintenance]);
    return newMaintenance;
  }, [generateTicketNumber, setMaintenance]);

  const updateMaintenance = useCallback((id: string, updates: Partial<Maintenance>) => {
    setMaintenance(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, [setMaintenance]);

  const addMaintenancePart = useCallback((maintenanceId: string, part: Omit<MaintenancePart, 'id'>) => {
    const newPart: MaintenancePart = { ...part, id: uuidv4() };
    
    setMaintenance(prev => prev.map(m => {
      if (m.id === maintenanceId) {
        return { ...m, parts: [...m.parts, newPart] };
      }
      return m;
    }));

    // Deduct from inventory (use functional update for accuracy)
    if (!part.inventoryId.startsWith('manual-')) {
      setInventory(prev => prev.map(inv =>
        inv.id === part.inventoryId
          ? { ...inv, quantity: Math.max(0, inv.quantity - part.quantity) }
          : inv
      ));
    }

    return newPart;
  }, [setInventory, setMaintenance]);

  const removeMaintenancePart = useCallback((maintenanceId: string, partId: string) => {
    const maint = maintenance.find(m => m.id === maintenanceId);
    const part = maint?.parts.find(p => p.id === partId);
    
    if (part && !part.inventoryId.startsWith('manual-')) {
      // Return to inventory (use functional update for accuracy)
      setInventory(prev => prev.map(inv =>
        inv.id === part.inventoryId
          ? { ...inv, quantity: inv.quantity + part.quantity }
          : inv
      ));
    }

    setMaintenance(prev => prev.map(m => {
      if (m.id === maintenanceId) {
        return { ...m, parts: m.parts.filter(p => p.id !== partId) };
      }
      return m;
    }));
  }, [maintenance, setInventory, setMaintenance]);

  const deliverMaintenance = useCallback((id: string, collectedAmount: number, safeId: string) => {
    const maint = maintenance.find(m => m.id === id);
    if (!maint) return;

    const partsCost = maint.parts.reduce((sum, p) => sum + p.total, 0);
    const profit = collectedAmount - partsCost - maint.additionalExpenses;

    updateMaintenance(id, {
      status: 'delivered',
      collectedAmount,
      finalCost: collectedAmount,
      profit,
      deliveredAt: new Date().toISOString(),
      safeId
    });

    // Update safe balance
    setSafes(prev => prev.map(s => 
      s.id === safeId ? { ...s, balance: s.balance + collectedAmount } : s
    ));

    // Add transaction
    const transaction: Transaction = {
      id: uuidv4(),
      type: 'maintenance',
      amount: collectedAmount,
      description: `صيانة ${maint.ticketNumber}`,
      referenceId: id,
      safeId,
      userId: currentUser?.id || '',
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [...prev, transaction]);
  }, [maintenance, currentUser, updateMaintenance, setSafes, setTransactions]);

  // Safe functions
  const addSafe = useCallback((safe: Omit<Safe, 'id'>) => {
    const newSafe: Safe = { ...safe, id: uuidv4() };
    setSafes(prev => [...prev, newSafe]);
    return newSafe;
  }, [setSafes]);

  // Transaction functions (for manual income/expense)
  const addTransaction = useCallback((
    type: 'income' | 'expense',
    amount: number,
    description: string,
    safeId: string
  ) => {
    const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    
    const transaction: Transaction = {
      id: uuidv4(),
      type,
      amount: finalAmount,
      description,
      referenceId: '',
      safeId,
      userId: currentUser?.id || '',
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [...prev, transaction]);

    // Update safe balance
    setSafes(prev => prev.map(s => 
      s.id === safeId ? { ...s, balance: s.balance + finalAmount } : s
    ));

    return transaction;
  }, [currentUser, setTransactions, setSafes]);

  const deleteTransaction = useCallback((id: string) => {
    const trans = transactions.find(t => t.id === id);
    if (trans && (trans.type === 'income' || trans.type === 'expense')) {
      // Reverse the effect on safe balance
      setSafes(prev => prev.map(s => 
        s.id === trans.safeId ? { ...s, balance: s.balance - trans.amount } : s
      ));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [transactions, setSafes, setTransactions]);

  const transferBetweenSafes = useCallback((fromId: string, toId: string, amount: number) => {
    setSafes(prev => prev.map(s => {
      if (s.id === fromId) return { ...s, balance: s.balance - amount };
      if (s.id === toId) return { ...s, balance: s.balance + amount };
      return s;
    }));

    // Add transactions
    const timestamp = new Date().toISOString();
    setTransactions(prev => [
      ...prev,
      {
        id: uuidv4(),
        type: 'transfer',
        amount: -amount,
        description: 'تحويل للخزنة أخرى',
        referenceId: '',
        safeId: fromId,
        userId: currentUser?.id || '',
        createdAt: timestamp
      },
      {
        id: uuidv4(),
        type: 'transfer',
        amount,
        description: 'تحويل من خزنة أخرى',
        referenceId: '',
        safeId: toId,
        userId: currentUser?.id || '',
        createdAt: timestamp
      }
    ]);
  }, [currentUser, setSafes, setTransactions]);

  // Notification functions
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, [setNotifications]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, [setNotifications]);

  // Statistics
  const getStatistics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = sales.filter(s => new Date(s.createdAt) >= monthStart);
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
    const monthProfit = monthSales.reduce((sum, s) => sum + s.profit, 0);

    const returnRefunds = saleReturns.reduce((sum, saleReturn) => sum + saleReturn.refundAmount, 0);
    const wasteCost = stockWastes.reduce((sum, waste) => sum + waste.totalCost, 0);

    const totalSafesBalance = safes.reduce((sum, s) => sum + s.balance, 0);

    const availableIMEI = imeiUnits.filter(u => u.status === 'available').length;
    const soldIMEI = imeiUnits.filter(u => u.status === 'sold').length;

    const pendingMaintenance = maintenance.filter(m => m.status === 'received' || m.status === 'in_progress').length;
    const completedMaintenance = maintenance.filter(m => m.status === 'delivered').length;

    const lowStockItems = inventory.filter(i => !i.hasIMEI && i.quantity <= i.minQuantity);

    const expiringWarranties = imeiUnits.filter(u => {
      if (!u.warrantyEndDate || u.status !== 'sold') return false;
      const warrantyDate = new Date(u.warrantyEndDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return warrantyDate <= thirtyDaysFromNow && warrantyDate >= today;
    });

    return {
      todaySales: todaySales.length,
      todayRevenue,
      todayProfit,
      monthSales: monthSales.length,
      monthRevenue,
      monthProfit,
      netMonthRevenue: monthRevenue - returnRefunds,
      netMonthProfit: monthProfit - returnRefunds - wasteCost,
      totalSafesBalance,
      availableIMEI,
      soldIMEI,
      pendingMaintenance,
      completedMaintenance,
      lowStockItems,
      expiringWarranties,
      totalCustomers: customers.length,
      returnRefunds,
      wasteCost,
      returnCount: saleReturns.length,
      wasteCount: stockWastes.length
    };
  }, [sales, saleReturns, stockWastes, safes, imeiUnits, maintenance, inventory, customers]);

  // Reset all data — atomically replace every store with defaults
  const resetAllData = useCallback(async () => {
    const defaultData = {
      users: initialUsers,
      customers: initialCustomers,
      categories: initialCategories,
      inventory: initialInventory,
      imeiUnits: initialIMEIUnits,
      sales: initialSales,
      saleReturns: initialSaleReturns,
      maintenance: initialMaintenance,
      safes: initialSafes,
      transactions: initialTransactions,
      suppliers: initialSuppliers,
      stockWastes: initialStockWastes,
      notifications: initialNotifications,
    };

    // Atomically clear + repopulate each store (guaranteed clean slate)
    await indexedDBUtils.resetAllStores(defaultData);
  }, []);

  return {
    // Loading state
    isLoading,

    // State
    users,
    currentUser,
    customers,
    categories,
    inventory,
    imeiUnits,
    sales,
    saleReturns,
    maintenance,
    safes,
    transactions,
    suppliers,
    stockWastes,
    notifications,
    isDarkMode,
    appSettings,

    // Setters
    setUsers,
    setCurrentUser,
    setCustomers,
    setCategories,
    setInventory,
    setImeiUnits,
    setSales,
    setSaleReturns,
    setMaintenance,
    setSafes,
    setTransactions,
    setSuppliers,
    setStockWastes,
    setNotifications,
    setIsDarkMode,
    setAppSettings,

    // Auth
    login,
    logout,

    // Customers
    addCustomer,
    updateCustomer,
    deleteCustomer,

    // Categories
    addCategory,

    // Inventory
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,

    // IMEI
    addIMEIUnit,
    updateIMEIUnit,
    deleteIMEIUnit,
    findIMEIByNumber,
    getIMEIHistory,

    // Sales
    generateInvoiceNumber,
    createSale,
    processSaleReturn,

    // Waste
    recordStockWaste,

    // Maintenance
    generateTicketNumber,
    createMaintenance,
    updateMaintenance,
    addMaintenancePart,
    removeMaintenancePart,
    deliverMaintenance,

    // Safes
    addSafe,
    transferBetweenSafes,

    // Transactions
    addTransaction,
    deleteTransaction,

    // Notifications
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Stats
    getStatistics,

    // Utils
    resetAllData
  };
}
