import { useState } from 'react';
import { Key, ShieldCheck, AlertCircle, Crown, Zap, Building, Lock } from 'lucide-react';
import { validateLicenseKey, storeLicense } from '../license/engine';
import { ActiveLicense, PLAN_FEATURES, PlanType } from '../license/types';

interface LicenseActivationProps {
  onActivated: (license: ActiveLicense) => void;
  onMasterAccess: () => void;
}

export default function LicenseActivation({ onActivated, onMasterAccess }: LicenseActivationProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const handleActivate = () => {
    if (!key.trim()) {
      setError('أدخل مفتاح التفعيل');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate validation delay
    setTimeout(() => {
      const result = validateLicenseKey(key.trim());
      if (result.valid && result.license) {
        storeLicense(result.license);
        onActivated(result.license);
      } else {
        setError(result.error || 'مفتاح غير صالح');
      }
      setLoading(false);
    }, 800);
  };

  const planIcons: Record<PlanType, typeof Crown> = {
    basic: Zap,
    pro: Crown,
    enterprise: Building
  };

  const planColors: Record<PlanType, string> = {
    basic: 'from-green-500 to-emerald-600',
    pro: 'from-blue-500 to-indigo-600',
    enterprise: 'from-purple-500 to-violet-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl shadow-blue-500/30">
            <span className="text-4xl">📱</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Mobile Shop Pro</h1>
          <p className="text-blue-300/80 mt-2">نظام إدارة محلات الموبايلات المتكامل</p>
        </div>

        {/* Activation Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Key className="text-blue-400" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">تفعيل النظام</h2>
              <p className="text-sm text-blue-300/60">أدخل مفتاح التفعيل للبدء</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-blue-200/80 mb-2 font-medium">مفتاح التفعيل</label>
              <textarea
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(''); }}
                placeholder="الصق مفتاح التفعيل هنا..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-sm font-mono resize-none transition"
                dir="ltr"
              />
            </div>

            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={20} />
                  تفعيل
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="text-sm text-blue-300/60 hover:text-blue-300 transition flex items-center gap-1"
            >
              <Crown size={14} />
              عرض الباقات المتاحة
            </button>
            <button
              onClick={onMasterAccess}
              className="text-xs text-white/20 hover:text-white/50 transition flex items-center gap-1"
            >
              <Lock size={12} />
              Master
            </button>
          </div>
        </div>

        {/* Plans Preview */}
        {showPlans && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {(['basic', 'pro', 'enterprise'] as PlanType[]).map(plan => {
              const features = PLAN_FEATURES[plan];
              const Icon = planIcons[plan];
              return (
                <div
                  key={plan}
                  className={`bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center ${plan === 'pro' ? 'ring-2 ring-blue-500/50 scale-105' : ''}`}
                >
                  <div className={`w-10 h-10 mx-auto mb-3 bg-gradient-to-br ${planColors[plan]} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm">{features.nameAr}</h3>
                  <p className="text-blue-300 font-bold text-lg mt-1">{features.price}</p>
                  <div className="mt-3 space-y-1 text-right">
                    <p className="text-xs text-blue-200/50">✓ {features.maxUsers} مستخدم</p>
                    <p className="text-xs text-blue-200/50">✓ {features.maxProducts > 9999 ? '∞' : features.maxProducts} منتج</p>
                    {features.hasIMEI && <p className="text-xs text-blue-200/50">✓ IMEI</p>}
                    {features.hasMaintenance && <p className="text-xs text-blue-200/50">✓ صيانة</p>}
                    {features.hasFinance && <p className="text-xs text-blue-200/50">✓ مالية</p>}
                  </div>
                  {plan === 'pro' && (
                    <div className="mt-2 text-[10px] bg-blue-500/20 text-blue-300 rounded-full py-1 font-bold">
                      الأكثر طلباً
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
