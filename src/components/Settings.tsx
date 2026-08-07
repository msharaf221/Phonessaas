import { useState, useRef, useEffect } from 'react';
import {
  RefreshCw, Moon, Sun, Shield, Database, HardDrive,
  Globe, Palette, Bell, Lock, ChevronLeft, Store,
  Printer, Download, AlertTriangle, Info, CheckCircle,
  Monitor, Smartphone, Upload
} from 'lucide-react';
import { User, AppSettings } from '../types';
import { indexedDBUtils } from '../hooks/useIndexedDB';

interface SettingsProps {
  currentUser: User;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onResetData: () => Promise<void>;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export default function Settings({ currentUser, isDarkMode, onToggleDarkMode, onResetData, settings, onSaveSettings }: SettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'security' | 'data' | 'about'>('general');
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [notifSound, setNotifSound] = useState(settings.notifSound);
  const [autoRefresh, setAutoRefresh] = useState(settings.autoRefresh);
  const [savedMsg, setSavedMsg] = useState('');

  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await onResetData();
      setShowResetConfirm(false);
      window.location.reload();
    } catch {
      alert('حدث خطأ أثناء إعادة التعيين');
      setResetting(false);
    }
  };

  const showSaved = () => {
    setSavedMsg('تم الحفظ بنجاح ✅');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  useEffect(() => {
    setShopName(settings.shopName);
    setShopPhone(settings.shopPhone);
    setShopAddress(settings.shopAddress);
    setReceiptFooter(settings.receiptFooter);
    setNotifSound(settings.notifSound);
    setAutoRefresh(settings.autoRefresh);
  }, [settings]);

  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0 });

  // Get IndexedDB storage info
  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        setStorageInfo({
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        });
      });
    }
  }, []);

  const handleSaveSettings = () => {
    onSaveSettings({
      shopName,
      shopPhone,
      shopAddress,
      receiptFooter,
      notifSound,
      autoRefresh
    });
    showSaved();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'general' as const, label: 'عام', icon: Store },
    { id: 'appearance' as const, label: 'المظهر', icon: Palette },
    { id: 'security' as const, label: 'الأمان', icon: Lock },
    { id: 'data' as const, label: 'البيانات', icon: Database },
    { id: 'about' as const, label: 'حول النظام', icon: Info },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Toast Notification */}
      {savedMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={18} />
          {savedMsg}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl font-bold border-2 border-white/30">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{currentUser.name}</h2>
            <p className="text-blue-200 mt-0.5">@{currentUser.username}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              currentUser.role === 'admin' 
                ? 'bg-red-500/30 text-red-100 border border-red-400/40' 
                : currentUser.role === 'manager' 
                ? 'bg-blue-500/30 text-blue-100 border border-blue-400/40' 
                : 'bg-white/20 text-white border border-white/30'
            }`}>
              {currentUser.role === 'admin' ? '🔑 مدير النظام' :
               currentUser.role === 'manager' ? '📋 مشرف' : '👤 موظف'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-right transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <ChevronLeft size={16} className="mr-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {/* ===== TAB: General ===== */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Store size={20} className="text-blue-600" />
                  بيانات المحل
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">المعلومات الأساسية للمحل التي تظهر على الفواتير والإيصالات</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم المحل</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={shopPhone}
                      onChange={e => setShopPhone(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">العنوان</label>
                    <input
                      type="text"
                      value={shopAddress}
                      onChange={e => setShopAddress(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Printer size={20} className="text-purple-600" />
                  إعدادات الإيصال
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">تخصيص الرسالة التي تظهر أسفل الإيصال</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">رسالة أسفل الإيصال</label>
                  <textarea
                    value={receiptFooter}
                    onChange={e => setReceiptFooter(e.target.value)}
                    rows={2}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Bell size={20} className="text-yellow-500" />
                  الإشعارات
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">التحكم في إشعارات النظام</p>

                <div className="space-y-4">
                  <ToggleRow
                    label="صوت الإشعارات"
                    description="تشغيل صوت عند وصول إشعار جديد"
                    checked={notifSound}
                    onChange={setNotifSound}
                  />
                  <ToggleRow
                    label="تحديث تلقائي"
                    description="تحديث البيانات تلقائياً كل 5 دقائق"
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                💾 حفظ الإعدادات
              </button>
            </div>
          )}

          {/* ===== TAB: Appearance ===== */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Palette size={20} className="text-pink-500" />
                  المظهر العام
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">اختر المظهر المناسب لك</p>

                {/* Theme Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Light Mode Card */}
                  <button
                    onClick={() => { if (isDarkMode) onToggleDarkMode(); }}
                    className={`relative p-5 rounded-2xl border-2 transition-all text-right ${
                      !isDarkMode 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {!isDarkMode && (
                      <div className="absolute top-3 left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-2xl flex items-center justify-center shadow-inner">
                        <Sun size={28} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-lg">الوضع النهاري</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ألوان فاتحة ومريحة للعين</p>
                      </div>
                    </div>
                    {/* Mini Preview */}
                    <div className="mt-4 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                      <div className="flex gap-2 mb-2">
                        <div className="w-8 h-2 bg-gray-200 rounded"></div>
                        <div className="w-12 h-2 bg-blue-200 rounded"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-10 bg-gray-100 rounded"></div>
                        <div className="flex-1 h-10 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </button>

                  {/* Dark Mode Card */}
                  <button
                    onClick={() => { if (!isDarkMode) onToggleDarkMode(); }}
                    className={`relative p-5 rounded-2xl border-2 transition-all text-right ${
                      isDarkMode 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {isDarkMode && (
                      <div className="absolute top-3 left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-inner">
                        <Moon size={28} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-lg">الوضع الليلي</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ألوان داكنة لراحة العين ليلاً</p>
                      </div>
                    </div>
                    {/* Mini Preview */}
                    <div className="mt-4 bg-gray-800 rounded-xl p-3 border border-gray-700">
                      <div className="flex gap-2 mb-2">
                        <div className="w-8 h-2 bg-gray-600 rounded"></div>
                        <div className="w-12 h-2 bg-blue-800 rounded"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-10 bg-gray-700 rounded"></div>
                        <div className="flex-1 h-10 bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Globe size={20} className="text-green-500" />
                  اللغة والمنطقة
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">إعدادات اللغة والعملة</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اللغة</label>
                    <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                      <option>العربية 🇪🇬</option>
                      <option>English 🇬🇧</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">العملة</label>
                    <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                      <option>جنيه مصري (EGP)</option>
                      <option>ريال سعودي (SAR)</option>
                      <option>دولار أمريكي (USD)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                💾 حفظ الإعدادات
              </button>
            </div>
          )}

          {/* ===== TAB: Security ===== */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Shield size={20} className="text-green-500" />
                  صلاحيات حسابك
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">الصفحات والإجراءات المتاحة لك حسب صلاحيتك</p>

                <div className={`p-4 rounded-xl border-2 mb-6 ${
                  currentUser.role === 'admin'
                    ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800'
                    : currentUser.role === 'manager'
                    ? 'bg-blue-50 dark:bg-blue-900/15 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      currentUser.role === 'admin' ? 'bg-red-200 dark:bg-red-800' :
                      currentUser.role === 'manager' ? 'bg-blue-200 dark:bg-blue-800' :
                      'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      {currentUser.role === 'admin' ? '🔑' : currentUser.role === 'manager' ? '📋' : '👤'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {currentUser.role === 'admin' ? 'مدير النظام' :
                         currentUser.role === 'manager' ? 'مشرف' : 'موظف'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentUser.role === 'admin' ? 'صلاحيات كاملة على جميع أجزاء النظام' :
                         currentUser.role === 'manager' ? 'صلاحيات إدارية بدون إدارة الموظفين' :
                         'صلاحيات محدودة للعمل اليومي'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { name: 'لوحة التحكم', roles: ['admin', 'manager', 'staff'] },
                    { name: 'نقطة البيع', roles: ['admin', 'manager', 'staff'] },
                    { name: 'الصيانة', roles: ['admin', 'manager', 'staff'] },
                    { name: 'العملاء', roles: ['admin', 'manager', 'staff'] },
                    { name: 'المخزون', roles: ['admin', 'manager'] },
                    { name: 'إدارة IMEI', roles: ['admin', 'manager'] },
                    { name: 'المبيعات', roles: ['admin', 'manager'] },
                    { name: 'الخزائن', roles: ['admin', 'manager'] },
                    { name: 'المالية', roles: ['admin', 'manager'] },
                    { name: 'الموردين', roles: ['admin', 'manager'] },
                    { name: 'الموظفين', roles: ['admin'] },
                    { name: 'الإعدادات', roles: ['admin'] },
                    { name: 'إعادة تعيين البيانات', roles: ['admin'] },
                  ].map(perm => {
                    const hasAccess = perm.roles.includes(currentUser.role);
                    return (
                      <div
                        key={perm.name}
                        className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                          hasAccess
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 line-through'
                        }`}
                      >
                        {hasAccess ? (
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <Lock size={16} className="text-gray-400 flex-shrink-0" />
                        )}
                        {perm.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Lock size={20} className="text-orange-500" />
                  تغيير كلمة المرور
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">يمكنك تغيير كلمة المرور الخاصة بك</p>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">كلمة المرور الحالية</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تأكيد كلمة المرور</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={showSaved}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition"
                  >
                    تغيير كلمة المرور
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== TAB: Data ===== */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <HardDrive size={20} className="text-blue-500" />
                  معلومات التخزين
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">البيانات محفوظة في قاعدة بيانات IndexedDB المتقدمة</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">حجم البيانات المستخدم</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatBytes(storageInfo.usage)}</p>
                    <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${storageInfo.quota > 0 ? Math.min((storageInfo.usage / storageInfo.quota) * 100, 100) : 0}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">من {formatBytes(storageInfo.quota)} متاح</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">نوع التخزين</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle size={22} />
                      IndexedDB
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">يدعم مئات الميجابايت من البيانات</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Download size={20} className="text-green-500" />
                  تصدير البيانات
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">تصدير نسخة احتياطية من بيانات النظام</p>

                <button
                  onClick={() => {
                    const data: Record<string, string | null> = {};
                    for (const key in localStorage) {
                      if (localStorage.hasOwnProperty(key) && key.startsWith('shop_')) {
                        data[key] = localStorage.getItem(key);
                      }
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mobile-shop-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showSaved();
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-lg shadow-green-600/20"
                >
                  <Download size={18} />
                  تصدير نسخة احتياطية
                </button>
              </div>

              {/* Restore Backup */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <Upload size={20} className="text-orange-500" />
                  استعادة نسخة احتياطية
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                  استرجاع بياناتك من ملف نسخة احتياطية سابق. سيتم استبدال البيانات الحالية.
                </p>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!confirm('سيتم استبدال جميع البيانات الحالية بالبيانات من الملف. هل أنت متأكد؟')) {
                      e.target.value = '';
                      return;
                    }
                    try {
                      const text = await file.text();
                      const parsed = JSON.parse(text);
                      if (parsed.data) {
                        await indexedDBUtils.importAllData(parsed.data);
                        showSaved();
                        setTimeout(() => window.location.reload(), 1500);
                      } else {
                        alert('ملف غير صالح');
                      }
                    } catch {
                      alert('حدث خطأ في قراءة الملف');
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
                >
                  <Upload size={18} />
                  اختيار ملف للاستعادة
                </button>
              </div>

              {/* Danger Zone - Admin Only */}
              {currentUser.role === 'admin' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-red-200 dark:border-red-800 p-6">
                  <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    منطقة الخطر
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">إجراءات لا يمكن التراجع عنها</p>

                  <div className="p-4 bg-red-50 dark:bg-red-900/15 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-red-800 dark:text-red-200">🗑️ إعادة تعيين جميع البيانات</p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          سيتم مسح جميع البيانات الحالية واستعادة البيانات الافتراضية. هذا الإجراء نهائي!
                        </p>
                      </div>
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition whitespace-nowrap shadow-lg shadow-red-600/20"
                      >
                        <RefreshCw size={18} />
                        إعادة تعيين
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: About ===== */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-4 shadow-lg shadow-blue-500/30">
                  📱
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">موبايل شوب</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">نظام إدارة محل الموبايلات المتكامل</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-mono mt-2">الإصدار 1.0.0</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">✨ مميزات النظام</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: '📊', title: 'لوحة تحكم ذكية', desc: 'إحصائيات ورسوم بيانية تفاعلية' },
                    { icon: '🛒', title: 'نقطة بيع احترافية', desc: 'مع دعم الباركود وIMEI' },
                    { icon: '📱', title: 'إدارة IMEI متقدمة', desc: 'تتبع كل جهاز برقمين IMEI' },
                    { icon: '🔧', title: 'نظام صيانة Kanban', desc: 'تتبع وإدارة تذاكر الصيانة' },
                    { icon: '👥', title: 'إدارة العملاء', desc: 'سجل مشتريات وأجهزة كل عميل' },
                    { icon: '💰', title: 'إدارة الخزائن', desc: 'تتبع الأموال والتحويلات' },
                    { icon: '🔐', title: 'صلاحيات متعددة', desc: 'مدير ومشرف وموظف' },
                    { icon: '🌙', title: 'وضع ليلي', desc: 'لراحة عينيك أثناء العمل ليلاً' },
                  ].map(feature => (
                    <div key={feature.title} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{feature.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Monitor size={16} />
                  معلومات تقنية
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'الواجهة الأمامية', value: 'React 19 + TypeScript' },
                    { label: 'التصميم', value: 'Tailwind CSS v4' },
                    { label: 'الرسوم البيانية', value: 'Recharts' },
                    { label: 'الأيقونات', value: 'Lucide React' },
                    { label: 'أداة البناء', value: 'Vite 7' },
                    { label: 'التخزين', value: 'LocalStorage (متصفح)' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="font-medium text-gray-800 dark:text-white font-mono text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Smartphone size={16} />
                  يعمل على
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['💻 ويندوز', '🍎 ماك', '🐧 لينكس', '📱 أندرويد', '📱 آيفون', '📟 تابلت'].map(p => (
                    <span key={p} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">تأكيد إعادة التعيين</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              هل أنت متأكد؟ سيتم <span className="font-bold text-red-500">مسح جميع البيانات</span> واستعادة البيانات الافتراضية.
              <br />
              <span className="text-sm">لا يمكن التراجع عن هذا الإجراء!</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '🗑️ مسح وإعادة تعيين'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Toggle Row Component =====
function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
      <div>
        <p className="font-medium text-gray-800 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
          checked ? 'right-0.5' : 'right-[22px]'
        }`} />
      </button>
    </div>
  );
}
