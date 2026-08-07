import { useState, useEffect } from 'react';
import { useStore } from './hooks/useStore';
import { ActiveLicense, PLAN_FEATURES } from './license/types';
import { clearLicense, getStoredLicense, isLicenseExpired } from './license/engine';
import LicenseActivation from './components/LicenseActivation';
import LicenseExpired from './components/LicenseExpired';
import MasterAdmin from './components/MasterAdmin';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import IMEIManager from './components/IMEIManager';
import MaintenanceBoard from './components/MaintenanceBoard';
import Customers from './components/Customers';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Safes from './components/Safes';
import Suppliers from './components/Suppliers';
import Users from './components/Users';
import Finance from './components/Finance';
import Settings from './components/Settings';

type PageType = 'dashboard' | 'pos' | 'inventory' | 'imei' | 'maintenance' | 'customers' | 'sales' | 'safes' | 'finance' | 'suppliers' | 'users' | 'settings';
type AppScreen = 'license' | 'master' | 'expired' | 'app';

export default function App() {
  const store = useStore();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [screen, setScreen] = useState<AppScreen>('license');
  const [license, setLicense] = useState<ActiveLicense | null>(null);

  // Check expiry while app is running (every minute)
  useEffect(() => {
    if (screen !== 'app' || !license) return;
    const interval = setInterval(() => {
      if (isLicenseExpired(license.expiresAt)) {
        setScreen('expired');
      }
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, [screen, license]);

  // Check for existing license on load
  useEffect(() => {
    const storedLicense = getStoredLicense(true);
    if (!storedLicense) {
      setLicense(null);
      setScreen('license');
      return;
    }

    setLicense(storedLicense);
    setScreen(isLicenseExpired(storedLicense.expiresAt) ? 'expired' : 'app');
  }, []);

  // Apply dark mode
  useEffect(() => {
    const html = document.documentElement;
    if (store.isDarkMode) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  }, [store.isDarkMode]);

  // Handle license activation
  const handleLicenseActivated = (activeLicense: ActiveLicense) => {
    setLicense(activeLicense);
    setScreen('app');
  };

  // Handle login
  const handleLogin = (username: string, password: string): boolean => {
    const user = store.login(username, password);
    return user !== null;
  };

  // Check if module is available
  const isModuleAvailable = (moduleId: string): boolean => {
    if (!license) return false;
    return PLAN_FEATURES[license.plan].modules.includes(moduleId);
  };

  // Navigate with plan check
  const handleNavigate = (page: string) => {
    if (isModuleAvailable(page)) {
      setCurrentPage(page as PageType);
    } else {
      alert(`هذه الميزة غير متاحة في باقتك الحالية (${PLAN_FEATURES[license?.plan || 'basic'].nameAr})\n\nقم بالترقية للباقة الاحترافية للحصول على جميع المميزات.`);
    }
  };

  // ===== SCREEN: LICENSE ACTIVATION =====
  if (screen === 'license') {
    return (
      <LicenseActivation
        onActivated={handleLicenseActivated}
        onMasterAccess={() => setScreen('master')}
      />
    );
  }

  // ===== SCREEN: LICENSE EXPIRED =====
  if (screen === 'expired' && license) {
    return (
      <LicenseExpired
        expiredLicense={license}
        onRenewed={(newLicense) => {
          setLicense(newLicense);
          setScreen('app');
        }}
        onDeactivate={() => {
          clearLicense();
          setLicense(null);
          setScreen('license');
        }}
      />
    );
  }

  // ===== SCREEN: MASTER ADMIN =====
  if (screen === 'master') {
    return <MasterAdmin onBack={() => setScreen('license')} />;
  }

  // ===== SCREEN: MAIN APP =====

  // Show loading
  if (store.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-4xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{store.appSettings.shopName || license?.shopName || 'موبايل شوب'}</h1>
          <p className="text-blue-200 mb-4">جاري تحميل البيانات...</p>
          <div className="w-48 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Show login
  if (!store.currentUser) {
    return <Login onLogin={handleLogin} shopName={store.appSettings.shopName} />;
  }

  // Handle deactivation
  const handleDeactivateLicense = () => {
    if (confirm('هل أنت متأكد من إلغاء تفعيل الترخيص؟ سيتم تسجيل خروجك.')) {
      clearLicense();
      store.logout();
      setLicense(null);
      setScreen('license');
    }
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            statistics={store.getStatistics}
            sales={store.sales}
            maintenance={store.maintenance}
            categories={store.categories}
            inventory={store.inventory}
          />
        );
      case 'pos':
        return (
          <POS
            inventory={store.inventory}
            imeiUnits={store.imeiUnits}
            customers={store.customers}
            categories={store.categories}
            safes={store.safes}
            shopName={store.appSettings.shopName || license?.shopName || 'موبايل شوب'}
            receiptFooter={store.appSettings.receiptFooter}
            onCreateSale={store.createSale}
            onAddCustomer={store.addCustomer}
          />
        );
      case 'inventory':
        return (
          <Inventory
            inventory={store.inventory}
            categories={store.categories}
            imeiUnits={store.imeiUnits}
            suppliers={store.suppliers}
            onAddItem={store.addInventoryItem}
            onUpdateItem={store.updateInventoryItem}
            onDeleteItem={store.deleteInventoryItem}
            onAddCategory={store.addCategory}
            onRecordWaste={store.recordStockWaste}
          />
        );
      case 'imei':
        return (
          <IMEIManager
            imeiUnits={store.imeiUnits}
            inventory={store.inventory}
            customers={store.customers}
            onAddIMEI={store.addIMEIUnit}
            onUpdateIMEI={store.updateIMEIUnit}
            onDeleteIMEI={store.deleteIMEIUnit}
            getIMEIHistory={store.getIMEIHistory}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceBoard
            maintenance={store.maintenance}
            inventory={store.inventory}
            safes={store.safes}
            customers={store.customers}
            onCreateMaintenance={store.createMaintenance}
            onUpdateMaintenance={store.updateMaintenance}
            onAddPart={store.addMaintenancePart}
            onRemovePart={store.removeMaintenancePart}
            onDeliverMaintenance={store.deliverMaintenance}
          />
        );
      case 'customers':
        return (
          <Customers
            customers={store.customers}
            sales={store.sales}
            imeiUnits={store.imeiUnits}
            inventory={store.inventory}
            maintenance={store.maintenance}
            onAddCustomer={store.addCustomer}
            onUpdateCustomer={store.updateCustomer}
            onDeleteCustomer={store.deleteCustomer}
          />
        );
      case 'sales':
        return (
          <Sales
            sales={store.sales}
            saleReturns={store.saleReturns}
            customers={store.customers}
            inventory={store.inventory}
            imeiUnits={store.imeiUnits}
            users={store.users}
            onProcessReturn={store.processSaleReturn}
          />
        );
      case 'safes':
        return (
          <Safes
            safes={store.safes}
            transactions={store.transactions}
            onAddSafe={store.addSafe}
            onTransfer={store.transferBetweenSafes}
          />
        );
      case 'finance':
        return (
          <Finance
            transactions={store.transactions}
            safes={store.safes}
            sales={store.sales}
            maintenance={store.maintenance}
            saleReturns={store.saleReturns}
            stockWastes={store.stockWastes}
            onAddTransaction={store.addTransaction}
            onDeleteTransaction={store.deleteTransaction}
          />
        );
      case 'suppliers':
        return (
          <Suppliers
            suppliers={store.suppliers}
            onUpdate={store.setSuppliers}
          />
        );
      case 'users':
        return (
          <Users
            users={store.users}
            currentUser={store.currentUser!}
            onUpdate={store.setUsers}
          />
        );
      case 'settings':
        return (
          <Settings
            currentUser={store.currentUser!}
            isDarkMode={store.isDarkMode}
            onToggleDarkMode={() => store.setIsDarkMode(!store.isDarkMode)}
            onResetData={store.resetAllData}
            settings={store.appSettings}
            onSaveSettings={store.setAppSettings}
          />
        );
      default:
        return (
          <Dashboard
            statistics={store.getStatistics}
            sales={store.sales}
            maintenance={store.maintenance}
            categories={store.categories}
            inventory={store.inventory}
          />
        );
    }
  };

  return (
    <Layout
      currentUser={store.currentUser}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={store.logout}
      isDarkMode={store.isDarkMode}
      onToggleDarkMode={() => store.setIsDarkMode(!store.isDarkMode)}
      notifications={store.notifications}
      onMarkNotificationRead={store.markNotificationAsRead}
      license={license}
      onDeactivateLicense={handleDeactivateLicense}
      shopName={store.appSettings.shopName || license?.shopName || 'موبايل شوب'}
    >
      {renderPage()}
    </Layout>
  );
}
