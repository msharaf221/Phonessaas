import { useState, useEffect } from 'react';
import {
  Key, Plus, Copy, Trash2, ArrowRight, Shield, CheckCircle,
  Crown, Zap, Building, X, Eye, EyeOff, Lock
} from 'lucide-react';
import { LicenseKey, PlanType, PLAN_FEATURES } from '../license/types';
import {
  generateLicenseKey, verifyMasterPassword,
  getStoredMasterKeys, storeMasterKeys, getDaysRemaining
} from '../license/engine';

interface MasterAdminProps {
  onBack: () => void;
}

export default function MasterAdmin({ onBack }: MasterAdminProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [showKeyModal, setShowKeyModal] = useState<LicenseKey | null>(null);

  const [form, setForm] = useState({
    plan: 'pro' as PlanType,
    shopName: '',
    issuedTo: '',
    durationDays: 365,
    maxUsers: 8,
    notes: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      setKeys(getStoredMasterKeys());
    }
  }, [isAuthenticated]);

  const handleAuth = () => {
    if (verifyMasterPassword(password)) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('كلمة مرور خاطئة');
    }
  };

  const handleGenerate = () => {
    if (!form.shopName) {
      alert('اسم المحل مطلوب');
      return;
    }

    const newKey = generateLicenseKey(
      form.plan,
      form.shopName,
      form.issuedTo,
      form.durationDays,
      form.maxUsers || PLAN_FEATURES[form.plan].maxUsers,
      form.notes
    );

    const updatedKeys = [newKey, ...keys];
    setKeys(updatedKeys);
    storeMasterKeys(updatedKeys);
    setShowGenerate(false);
    setShowKeyModal(newKey);
    setForm({ plan: 'pro', shopName: '', issuedTo: '', durationDays: 365, maxUsers: 8, notes: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المفتاح؟')) {
      const updatedKeys = keys.filter(k => k.id !== id);
      setKeys(updatedKeys);
      storeMasterKeys(updatedKeys);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const planColors: Record<PlanType, string> = {
    basic: 'bg-green-500',
    pro: 'bg-blue-500',
    enterprise: 'bg-purple-500'
  };

  const planIcons: Record<PlanType, typeof Crown> = {
    basic: Zap,
    pro: Crown,
    enterprise: Building
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-950 to-red-950 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl mb-4">
              <Shield className="text-red-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Master Admin</h1>
            <p className="text-red-300/60 mt-1 text-sm">لوحة تحكم مولّد المفاتيح</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            {authError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                {authError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-red-200/70 mb-2">كلمة المرور الرئيسية</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                  placeholder="••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white placeholder-red-300/30 focus:outline-none focus:border-red-500/50"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-red-300/40 hover:text-red-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleAuth}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition flex items-center justify-center gap-2"
            >
              <Lock size={18} />
              دخول
            </button>

            <button
              onClick={onBack}
              className="w-full mt-3 py-2 text-red-300/50 hover:text-red-300 text-sm transition flex items-center justify-center gap-1"
            >
              <ArrowRight size={14} />
              رجوع
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main admin panel
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
              <Shield className="text-red-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Master Admin Panel</h1>
              <p className="text-slate-400 text-sm">إدارة مفاتيح التفعيل والباقات</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-600/20"
            >
              <Plus size={18} />
              توليد مفتاح جديد
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition flex items-center gap-2"
            >
              <ArrowRight size={16} />
              رجوع
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">إجمالي المفاتيح</p>
            <p className="text-3xl font-bold text-white mt-1">{keys.length}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
            <p className="text-green-300/70 text-sm">أساسي</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{keys.filter(k => k.plan === 'basic').length}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
            <p className="text-blue-300/70 text-sm">احترافي</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{keys.filter(k => k.plan === 'pro').length}</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
            <p className="text-purple-300/70 text-sm">مؤسسي</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">{keys.filter(k => k.plan === 'enterprise').length}</p>
          </div>
        </div>

        {/* Keys Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-bold">المفاتيح المولّدة</h3>
          </div>

          {keys.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Key size={40} className="mx-auto mb-3 opacity-30" />
              <p>لم يتم توليد أي مفاتيح بعد</p>
              <p className="text-sm mt-1">اضغط "توليد مفتاح جديد" للبدء</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">الباقة</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">المحل</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">صدر لـ</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">الصلاحية</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">ينتهي</th>
                    <th className="px-4 py-3 text-center text-xs text-slate-400 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {keys.map(k => {
                    const Icon = planIcons[k.plan];
                    const remaining = getDaysRemaining(k.expiresAt);
                    const isExpired = remaining === 0;
                    return (
                      <tr key={k.id} className={`hover:bg-white/5 ${isExpired ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 ${planColors[k.plan]} rounded-lg flex items-center justify-center`}>
                              <Icon size={14} className="text-white" />
                            </div>
                            <span className="text-white font-medium text-sm">
                              {PLAN_FEATURES[k.plan].nameAr}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white text-sm">{k.shopName}</td>
                        <td className="px-4 py-3 text-slate-400 text-sm">{k.issuedTo || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isExpired ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                          }`}>
                            {isExpired ? 'منتهي' : `${remaining} يوم`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {new Date(k.expiresAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { copyToClipboard(k.key, k.id); }}
                              className={`p-2 rounded-lg transition ${
                                copiedId === k.id ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:bg-white/10'
                              }`}
                              title="نسخ المفتاح"
                            >
                              {copiedId === k.id ? <CheckCircle size={16} /> : <Copy size={16} />}
                            </button>
                            <button
                              onClick={() => setShowKeyModal(k)}
                              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                              title="عرض"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(k.id)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Key size={20} className="text-blue-400" />
                توليد مفتاح جديد
              </h3>
              <button onClick={() => setShowGenerate(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Plan Selection */}
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">الباقة</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['basic', 'pro', 'enterprise'] as PlanType[]).map(plan => {
                    const Icon = planIcons[plan];
                    return (
                      <button
                        key={plan}
                        onClick={() => setForm(prev => ({
                          ...prev,
                          plan,
                          maxUsers: PLAN_FEATURES[plan].maxUsers
                        }))}
                        className={`p-3 rounded-xl border-2 transition text-center ${
                          form.plan === plan
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Icon size={18} className={`mx-auto mb-1 ${form.plan === plan ? 'text-blue-400' : 'text-slate-500'}`} />
                        <p className="text-white text-sm font-bold">{PLAN_FEATURES[plan].nameAr}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">اسم المحل *</label>
                <input
                  type="text"
                  value={form.shopName}
                  onChange={e => setForm(prev => ({ ...prev, shopName: e.target.value }))}
                  placeholder="مثال: محل أبو علي للموبايلات"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">رقم الهاتف / الإيميل</label>
                <input
                  type="text"
                  value={form.issuedTo}
                  onChange={e => setForm(prev => ({ ...prev, issuedTo: e.target.value }))}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5 font-medium">مدة الصلاحية (أيام)</label>
                  <select
                    value={form.durationDays}
                    onChange={e => setForm(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value={14}>14 يوم (تجربة)</option>
                    <option value={30}>30 يوم (شهر)</option>
                    <option value={90}>90 يوم (3 شهور)</option>
                    <option value={180}>180 يوم (6 شهور)</option>
                    <option value={365}>365 يوم (سنة)</option>
                    <option value={730}>730 يوم (سنتين)</option>
                    <option value={3650}>10 سنين</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5 font-medium">عدد المستخدمين</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUsers}
                    onChange={e => setForm(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">ملاحظات</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات إضافية..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowGenerate(false)}
                className="px-4 py-2 border border-white/10 rounded-xl text-slate-300 hover:bg-white/5"
              >
                إلغاء
              </button>
              <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
              >
                <Key size={16} />
                توليد المفتاح
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Detail Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">🔑 تفاصيل المفتاح</h3>
              <button onClick={() => setShowKeyModal(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">الباقة</p>
                  <p className="text-white font-bold">{PLAN_FEATURES[showKeyModal.plan].nameAr}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">المحل</p>
                  <p className="text-white font-bold">{showKeyModal.shopName}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">الصلاحية</p>
                  <p className="text-white font-bold">{getDaysRemaining(showKeyModal.expiresAt)} يوم</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">المستخدمين</p>
                  <p className="text-white font-bold">{showKeyModal.maxUsers}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">مفتاح التفعيل (انسخه وابعته للعميل)</p>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 relative">
                  <pre className="text-green-400 text-xs font-mono break-all whitespace-pre-wrap leading-relaxed" dir="ltr">
                    {showKeyModal.key}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(showKeyModal.key, showKeyModal.id)}
                    className={`absolute top-2 left-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      copiedId === showKeyModal.id ? 'bg-green-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {copiedId === showKeyModal.id ? '✓ تم النسخ' : '📋 نسخ'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10">
              <button
                onClick={() => setShowKeyModal(null)}
                className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10"
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
