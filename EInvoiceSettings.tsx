
import React, { useState, useEffect } from 'react';
import { Save, Server, ShieldCheck, AlertCircle } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { EInvoiceIntegratorConfig } from '../types';

const EInvoiceSettings = () => {
  const { einvoiceConfig, updateEInvoiceConfig } = useSales();
  
  const [config, setConfig] = useState<EInvoiceIntegratorConfig>({
      integrator: 'PARASUT',
      username: '',
      password: '',
      apiKey: '',
      apiSecret: '',
      isProduction: false
  });

  useEffect(() => {
      if (einvoiceConfig) {
          setConfig(einvoiceConfig);
      }
  }, [einvoiceConfig]);

  const handleSave = () => {
      updateEInvoiceConfig(config);
      alert("Entegratör ayarları başarıyla kaydedildi.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <Server size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">e-Fatura / e-Arşiv Ayarları</h2>
                <p className="text-slate-500">Entegratör firma bilgilerinizi yapılandırın.</p>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-600"/>
                    Entegratör Seçimi
                </h3>
            </div>
            
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Hizmet Sağlayıcı</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                            value={config.integrator}
                            onChange={(e) => setConfig({...config, integrator: e.target.value as any})}
                        >
                            <option value="PARASUT">Paraşüt</option>
                            <option value="UYUMSOFT">Uyumsoft</option>
                            <option value="LOGO">Logo İşbaşı</option>
                            <option value="GIB_PORTAL">GİB Portal (Manuel)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Seçtiğiniz entegratörün API servisleri üzerinden fatura gönderimi yapılacaktır.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-blue-800 text-sm">Çalışma Modu</h4>
                                <div className="mt-2 flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="mode" 
                                            checked={!config.isProduction} 
                                            onChange={() => setConfig({...config, isProduction: false})}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">Test / Sandbox</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="mode" 
                                            checked={config.isProduction} 
                                            onChange={() => setConfig({...config, isProduction: true})}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700 font-bold">Canlı (Production)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-slate-700 mb-4">API Kimlik Bilgileri</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key / Client ID</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 font-mono text-sm placeholder-gray-500"
                                value={config.apiKey || ''}
                                onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                                placeholder="Entegratörden alınan anahtar"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Secret / Şifre</label>
                            <input 
                                type="password" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 font-mono text-sm placeholder-gray-500"
                                value={config.apiSecret || ''}
                                onChange={(e) => setConfig({...config, apiSecret: e.target.value})}
                                placeholder="••••••••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kullanıcı Adı (Opsiyonel)</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500"
                                value={config.username || ''}
                                onChange={(e) => setConfig({...config, username: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parola (Opsiyonel)</label>
                            <input 
                                type="password" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500"
                                value={config.password || ''}
                                onChange={(e) => setConfig({...config, password: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium shadow-md transition-colors"
                >
                    <Save size={20} />
                    Ayarları Kaydet
                </button>
            </div>
        </div>
    </div>
  );
};

export default EInvoiceSettings;
