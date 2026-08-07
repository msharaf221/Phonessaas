import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote,
  Printer, User, X, Check, ShoppingBag
} from 'lucide-react';
import { Customer, InventoryItem, IMEIUnit, Safe, Category, SaleItem } from '../types';

interface POSProps {
  inventory: InventoryItem[];
  imeiUnits: IMEIUnit[];
  customers: Customer[];
  categories: Category[];
  safes: Safe[];
  shopName: string;
  receiptFooter: string;
  onCreateSale: (
    customerId: string,
    items: Omit<SaleItem, 'id'>[],
    discount: number,
    paymentMethod: 'cash' | 'card' | 'installment',
    safeId: string,
    notes: string
  ) => { invoiceNumber: string };
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
}

interface CartItem {
  inventoryId: string;
  imeiUnitId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
  hasIMEI: boolean;
  imei1?: string;
}

export default function POS({
  inventory,
  imeiUnits,
  customers,
  categories,
  safes,
  shopName,
  receiptFooter,
  onCreateSale,
  onAddCustomer
}: POSProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showIMEIModal, setShowIMEIModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'installment'>('cash');
  const [selectedSafe, setSelectedSafe] = useState(safes.find(s => s.isDefault)?.id || safes[0]?.id);
  const [notes, setNotes] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<{ items: CartItem[], total: number, customer: Customer | null, invoiceNumber: string } | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus on search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Filter products based on search
  const filteredProducts = inventory.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.code.toLowerCase().includes(searchLower) ||
      item.barcode.includes(searchTerm)
    );
  });

  // Get available IMEI units for a product
  const getAvailableIMEIs = (inventoryId: string) => {
    return imeiUnits.filter(
      unit => unit.inventoryId === inventoryId && unit.status === 'available'
    );
  };

  // Add item to cart
  const addToCart = (item: InventoryItem, imeiUnit?: IMEIUnit) => {
    if (item.hasIMEI) {
      // For IMEI items, show selection modal
      if (!imeiUnit) {
        const availableUnits = getAvailableIMEIs(item.id);
        if (availableUnits.length === 0) {
          alert('لا توجد أجهزة متاحة من هذا النوع');
          return;
        }
        setSelectedInventoryItem(item);
        setShowIMEIModal(true);
        return;
      }

      // Add specific IMEI unit
      const existingIndex = cart.findIndex(c => c.imeiUnitId === imeiUnit.id);
      if (existingIndex >= 0) {
        alert('هذا الجهاز موجود بالفعل في السلة');
        return;
      }

      setCart(prev => [
        ...prev,
        {
          inventoryId: item.id,
          imeiUnitId: imeiUnit.id,
          name: `${item.name} (${imeiUnit.color} - ${imeiUnit.storage})`,
          quantity: 1,
          unitPrice: item.sellPrice,
          costPrice: imeiUnit.purchasePrice,
          total: item.sellPrice,
          hasIMEI: true,
          imei1: imeiUnit.imei1
        }
      ]);
    } else {
      // For non-IMEI items
      const existingIndex = cart.findIndex(c => c.inventoryId === item.id && !c.hasIMEI);
      if (existingIndex >= 0) {
        // Increase quantity
        const newCart = [...cart];
        if (newCart[existingIndex].quantity < item.quantity) {
          newCart[existingIndex].quantity += 1;
          newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].unitPrice;
          setCart(newCart);
        } else {
          alert('الكمية المتاحة غير كافية');
        }
      } else {
        if (item.quantity <= 0) {
          alert('المنتج غير متاح في المخزون');
          return;
        }
        setCart(prev => [
          ...prev,
          {
            inventoryId: item.id,
            name: item.name,
            quantity: 1,
            unitPrice: item.sellPrice,
            costPrice: item.costPrice,
            total: item.sellPrice,
            hasIMEI: false
          }
        ]);
      }
    }
    setSearchTerm('');
  };

  // Update cart item quantity
  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    
    if (item.hasIMEI) return; // Can't change quantity for IMEI items

    const invItem = inventory.find(i => i.id === item.inventoryId);
    if (!invItem) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
    } else if (newQty <= invItem.quantity) {
      item.quantity = newQty;
      item.total = newQty * item.unitPrice;
      setCart(newCart);
    } else {
      alert('الكمية المتاحة غير كافية');
    }
  };

  // Update price
  const updatePrice = (index: number, newPrice: number) => {
    const newCart = [...cart];
    newCart[index].unitPrice = newPrice;
    newCart[index].total = newCart[index].quantity * newPrice;
    setCart(newCart);
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount;

  // Complete sale
  const completeSale = () => {
    if (cart.length === 0) {
      alert('السلة فارغة');
      return;
    }

    const saleItems: Omit<SaleItem, 'id'>[] = cart.map(item => ({
      inventoryId: item.inventoryId,
      imeiUnitId: item.imeiUnitId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      total: item.total
    }));

    const sale = onCreateSale(
      selectedCustomer?.id || '',
      saleItems,
      discount,
      paymentMethod,
      selectedSafe,
      notes
    );

    // Show receipt
    setLastSale({
      items: [...cart],
      total,
      customer: selectedCustomer,
      invoiceNumber: sale.invoiceNumber
    });
    setShowReceipt(true);

    // Reset
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setNotes('');
  };

  // Add new customer
  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert('الاسم ورقم الهاتف مطلوبان');
      return;
    }

    const customer = onAddCustomer(newCustomer);
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setNewCustomer({ name: '', phone: '', address: '' });
  };

  // Handle barcode scan (Enter key)
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm) {
      const item = inventory.find(i => i.barcode === searchTerm);
      if (item) {
        addToCart(item);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="ابحث بالاسم أو الكود أو الباركود..."
              className="w-full py-3 pr-10 pl-4 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(item => {
              const category = categories.find(c => c.id === item.categoryId);
              const availableCount = item.hasIMEI 
                ? getAvailableIMEIs(item.id).length 
                : item.quantity;
              
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  disabled={availableCount === 0}
                  className={`
                    p-4 rounded-xl border text-right transition-all
                    ${availableCount === 0
                      ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      category?.type === 'device' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      category?.type === 'accessory' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    }`}>
                      {category?.name}
                    </span>
                    <span className={`text-xs font-bold ${
                      availableCount <= 5 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {availableCount}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-800 dark:text-white text-sm line-clamp-2 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(item.sellPrice)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Customer Selection */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex-1 flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <User size={18} className="text-gray-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {selectedCustomer ? selectedCustomer.name : 'اختر عميل (اختياري)'}
              </span>
            </button>
            {selectedCustomer && (
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingBag size={48} className="mb-2" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                      {item.name}
                    </h4>
                    {item.imei1 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        IMEI: {item.imei1}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  {!item.hasIMEI ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium text-gray-800 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">×1</span>
                  )}
                  
                  <div className="text-left">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updatePrice(index, Number(e.target.value))}
                      className="w-24 text-left text-sm p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                    />
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Discount */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">الخصم:</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-28 text-left p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span>الإجمالي الفرعي:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between text-xl font-bold text-gray-800 dark:text-white">
            <span>الإجمالي:</span>
            <span className="text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
          </div>

          {/* Payment Method */}
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition ${
                paymentMethod === 'cash'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Banknote size={18} />
              <span>نقدي</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition ${
                paymentMethod === 'card'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              <CreditCard size={18} />
              <span>بطاقة</span>
            </button>
          </div>

          {/* Safe Selection */}
          <select
            value={selectedSafe}
            onChange={(e) => setSelectedSafe(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            {safes.map(safe => (
              <option key={safe.id} value={safe.id}>{safe.name}</option>
            ))}
          </select>

          {/* Complete Sale Button */}
          <button
            onClick={completeSale}
            disabled={cart.length === 0}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check size={20} />
            إتمام البيع
          </button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">اختيار عميل</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Search Customers */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="ابحث عن عميل..."
                  className="w-full py-2 pr-10 pl-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Customers List */}
            <div className="flex-1 overflow-y-auto">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  className="w-full p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-right"
                >
                  <p className="font-medium text-gray-800 dark:text-white">{customer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>
                </button>
              ))}
            </div>

            {/* Add New Customer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <h4 className="font-medium text-gray-800 dark:text-white">إضافة عميل جديد</h4>
              <input
                type="text"
                placeholder="اسم العميل"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              <input
                type="tel"
                placeholder="رقم الهاتف"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              <button
                onClick={handleAddCustomer}
                className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                إضافة العميل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMEI Selection Modal */}
      {showIMEIModal && selectedInventoryItem && (
        <div className="modal-overlay" onClick={() => setShowIMEIModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                اختر جهاز - {selectedInventoryItem.name}
              </h3>
              <button
                onClick={() => setShowIMEIModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-3">
                {getAvailableIMEIs(selectedInventoryItem.id).map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => {
                      addToCart(selectedInventoryItem, unit);
                      setShowIMEIModal(false);
                      setSelectedInventoryItem(null);
                    }}
                    className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-right transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          unit.condition === 'new' ? 'bg-green-100 text-green-700' :
                          unit.condition === 'used' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {unit.condition === 'new' ? 'جديد' : unit.condition === 'used' ? 'مستعمل' : 'مجدد'}
                        </span>
                      </div>
                      <p className="font-bold text-blue-600">{formatCurrency(selectedInventoryItem.sellPrice)}</p>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {unit.color} - {unit.storage} - {unit.ram}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        IMEI: {unit.imei1}
                      </p>
                      {unit.imei2 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          IMEI2: {unit.imei2}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 print:p-4" id="receipt-content">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📱 {shopName}</h2>
                <p className="text-gray-500 dark:text-gray-400">فاتورة مبيعات</p>
              </div>

              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  رقم الفاتورة: {lastSale.invoiceNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  التاريخ: {new Date().toLocaleDateString('ar-EG')}
                </p>
                {lastSale.customer && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    العميل: {lastSale.customer.name}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {lastSale.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-800 dark:text-white">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white">
                  <span>الإجمالي</span>
                  <span className="text-blue-600">{formatCurrency(lastSale.total)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
                <p>{receiptFooter}</p>
                <p>نتمنى لكم يوماً سعيداً</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Printer size={18} />
                طباعة
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
