
import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertCircle, ShoppingCart, Sparkles, Loader2, Calendar, CheckCircle2, X } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status, Check } from '../types';
import { GoogleGenAI } from "@google/genai";
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    {subtext && <p className="text-xs text-slate-400 mt-3">{subtext}</p>}
  </div>
);

const Dashboard = () => {
  const { products, documents, checks } = useSales();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCheckReminder, setShowCheckReminder] = useState(false);

  // Calculate Metrics
  const lowStockCount = products.filter(p => p.stock < 10).length;
  const pendingOrders = documents.filter(d => d.type === DocType.ORDER && d.status !== Status.INVOICED).length;
  const totalRevenue = documents
    .filter(d => d.type === DocType.INVOICE)
    .reduce((sum, d) => sum + d.totalAmount, 0);

  // Check for upcoming checks (Due today or next 3 days)
  const dueChecks = checks.filter(c => {
      if (c.status !== 'PENDING') return false;
      const today = new Date();
      today.setHours(0,0,0,0);
      const dueDate = new Date(c.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays >= 0 && diffDays <= 3;
  });

  useEffect(() => {
      if (dueChecks.length > 0) {
          setShowCheckReminder(true);
      }
  }, [checks]);

  const generateAIInsight = async () => {
    if (!process.env.API_KEY) {
      setInsight("API Key eksik. Lütfen yapılandırın.");
      return;
    }
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Sen bir KOBİ finans danışmanısın. Aşağıdaki verileri analiz et ve işletme sahibine Türkçe, samimi ve profesyonel 3 kısa tavsiye maddesi yaz.
        Veriler:
        - Kritik Stoktaki Ürün Sayısı: ${lowStockCount} (Stok < 10)
        - Bekleyen (Faturalanmamış) Siparişler: ${pendingOrders}
        - Toplam Ciro: ${totalRevenue} TL
        - Yaklaşan Çek Ödemeleri: ${dueChecks.length} adet
        - En son satılan ürünler: ${documents.filter(d => d.type === DocType.INVOICE).slice(0,3).map(d => d.items.map(i => i.productName).join(', ')).join(' | ')}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      setInsight(response.text);
    } catch (error) {
      console.error(error);
      setInsight("AI analizi şu anda yapılamıyor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Yönetim Paneli</h2>
          <p className="text-slate-500">İşletmenizin anlık finansal özeti</p>
        </div>
        <button 
          onClick={generateAIInsight}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:opacity-90 transition-opacity disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {insight ? "Analizi Yenile" : "AI Finans Asistanı"}
        </button>
      </div>

      {insight && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-100 p-6 rounded-xl shadow-sm">
           <div className="flex items-center gap-2 mb-3">
             <Sparkles className="text-indigo-600 w-5 h-5" />
             <h3 className="font-semibold text-indigo-900">Gemini Finansal İçgörüsü</h3>
           </div>
           <div className="prose prose-indigo text-slate-700 text-sm whitespace-pre-wrap">
             {insight}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Toplam Ciro" 
          value={`₺${totalRevenue.toLocaleString('tr-TR')}`} 
          subtext="Bu yılın toplam fatura tutarı"
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Bekleyen Siparişler" 
          value={pendingOrders} 
          subtext="Faturalandırma bekleyenler"
          icon={ShoppingCart} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Kritik Stok" 
          value={lowStockCount} 
          subtext="10 adedin altındaki ürünler"
          icon={AlertCircle} 
          color="bg-red-500" 
        />
        <StatCard 
          title="Portföydeki Çekler" 
          value={checks.filter(c => c.status === 'PENDING').length} 
          subtext="Vadesi bekleyen çekler"
          icon={Activity} 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Son İşlemler</h3>
          <div className="space-y-4">
            {documents.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                   <div className={`w-2 h-2 rounded-full ${doc.type === DocType.INVOICE ? 'bg-emerald-500' : doc.type === DocType.ORDER ? 'bg-blue-500' : 'bg-amber-500'}`} />
                   <div>
                     <p className="text-sm font-medium text-slate-900">{doc.type} - {doc.id}</p>
                     <p className="text-xs text-slate-500">{doc.customer.name}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-bold text-slate-700">₺{doc.totalAmount.toLocaleString('tr-TR')}</p>
                   <p className="text-xs text-slate-500">{doc.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-all text-left">
              <span className="block font-medium text-blue-600 mb-1">+ Yeni Teklif</span>
              <span className="text-xs text-slate-500">Müşteriye teklif hazırla</span>
            </button>
            <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-emerald-300 transition-all text-left">
              <span className="block font-medium text-emerald-600 mb-1">+ Stok Girişi</span>
              <span className="text-xs text-slate-500">Depoya ürün ekle</span>
            </button>
            <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-purple-300 transition-all text-left">
              <span className="block font-medium text-purple-600 mb-1">E-Fatura Kontrol</span>
              <span className="text-xs text-slate-500">Paraşüt entegrasyonu</span>
            </button>
             <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-orange-300 transition-all text-left">
              <span className="block font-medium text-orange-600 mb-1">Rapor Al</span>
              <span className="text-xs text-slate-500">Gün sonu özeti</span>
            </button>
          </div>
        </div>
      </div>

      {/* Due Check Reminder Popup */}
      {showCheckReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                  <div className="p-4 border-b border-amber-100 bg-amber-50 flex justify-between items-center">
                      <h3 className="font-bold text-amber-800 flex items-center gap-2">
                          <AlertCircle size={20} className="text-amber-600" />
                          Yaklaşan Çek Ödemeleri
                      </h3>
                      <button onClick={() => setShowCheckReminder(false)} className="text-amber-400 hover:text-amber-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-slate-600 mb-4">
                          Dikkat! Vadesi bugün veya önümüzdeki 3 gün içinde dolacak olan çekleriniz var.
                      </p>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                          {dueChecks.map(check => (
                              <div key={check.id} className="p-3 border border-amber-100 bg-amber-50/50 rounded-lg flex justify-between items-center">
                                  <div>
                                      <div className="font-bold text-slate-800">{check.checkNumber} - {check.bankName}</div>
                                      <div className="text-xs text-slate-500">{check.drawer}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-amber-700">{check.amount.toLocaleString()} {check.currency}</div>
                                      <div className="text-xs font-medium text-amber-600">{check.dueDate}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setShowCheckReminder(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">Kapat</button>
                      <button onClick={() => navigate('/accounting/checks')} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
                          Çek Listesine Git
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
