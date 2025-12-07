
import React, { useState } from 'react';
import { LayoutDashboard, Package, FileText, PieChart, Wallet, Menu, ChevronDown, ChevronRight, ShoppingCart, Receipt, Users, RefreshCw, WifiOff, FileCheck2, Calculator, Landmark, Settings, Server, Shield, Building, LogOut, Truck, CreditCard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSales } from '../context/SalesContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRates, ratesLoading, ratesError, refreshRates, currentUser, logout } = useSales();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Menülerin başlangıç durumu kapalı (false) olarak ayarlandı
  const [isSalesMenuOpen, setIsSalesMenuOpen] = useState(false);
  const [isAccountingMenuOpen, setIsAccountingMenuOpen] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isInventoryMenuOpen, setIsInventoryMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden print:h-auto print:overflow-visible print:block">
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl print:hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Wallet className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">KOBİ Sys</h1>
              <p className="text-xs text-slate-400">Ticari Yönetim</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* 1. Panel */}
          <button onClick={() => navigate('/')} className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${location.pathname === '/' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={20} /><span className="font-medium">Panel</span></button>
          
          {/* 2. Satışlar */}
          <div className="space-y-1">
            <button onClick={() => setIsSalesMenuOpen(!isSalesMenuOpen)} className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/sales') && !isActive('/sales/reconciliation') ? 'text-white bg-slate-800' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><div className="flex items-center gap-3"><ShoppingCart size={20} /><span className="font-medium">Satışlar</span></div>{isSalesMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
            {isSalesMenuOpen && (
              <div className="pl-12 space-y-1">
                <button onClick={() => navigate('/sales/quotes')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/sales/quotes') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><FileText size={16} /> Teklifler</button>
                <button onClick={() => navigate('/sales/orders')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/sales/orders') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Package size={16} /> Siparişler</button>
                <button onClick={() => navigate('/sales/invoices')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/sales/invoices') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Receipt size={16} /> Faturalar</button>
                <button onClick={() => navigate('/sales/customers')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/sales/customers') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Users size={16} /> Müşteriler</button>
              </div>
            )}
          </div>

          {/* 3. Muhasebe */}
          <div className="space-y-1">
            <button onClick={() => setIsAccountingMenuOpen(!isAccountingMenuOpen)} className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/accounting') ? 'text-white bg-slate-800' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><div className="flex items-center gap-3"><Calculator size={20} /><span className="font-medium">Muhasebe</span></div>{isAccountingMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
            {isAccountingMenuOpen && (
              <div className="pl-12 space-y-1">
                <button onClick={() => navigate('/accounting/banks')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/accounting/banks') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Landmark size={16} /> Bankalar & Kasalar</button>
                <button onClick={() => navigate('/accounting/checks')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/accounting/checks') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><CreditCard size={16} /> Çek Takip</button>
                <button onClick={() => navigate('/sales/reconciliation')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/sales/reconciliation') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><FileCheck2 size={16} /> Mutabakat</button>
              </div>
            )}
          </div>

          {/* 4. Depo */}
          <div className="space-y-1">
            <button onClick={() => setIsInventoryMenuOpen(!isInventoryMenuOpen)} className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/inventory') ? 'text-white bg-slate-800' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><div className="flex items-center gap-3"><Package size={20} /><span className="font-medium">Depo</span></div>{isInventoryMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
            {isInventoryMenuOpen && (
              <div className="pl-12 space-y-1">
                <button onClick={() => navigate('/inventory/products')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/inventory/products') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Package size={16} /> Ürün ve Hizmetler</button>
                <button onClick={() => navigate('/inventory/waybills')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/inventory/waybills') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Truck size={16} /> Sevk İrsaliyeleri</button>
              </div>
            )}
          </div>

          {/* 5. Raporlar */}
          <button onClick={() => navigate('/reports')} className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/reports') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><PieChart size={20} /><span className="font-medium">Raporlar & FIFO</span></button>

          {/* 6. Sistem */}
          <div className="space-y-1 pt-4 border-t border-slate-800 mt-4">
            <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/settings') || isActive('/einvoice') ? 'text-white bg-slate-800' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><div className="flex items-center gap-3"><Settings size={20} /><span className="font-medium">Sistem & Ayarlar</span></div>{isSystemMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
            {isSystemMenuOpen && (
              <div className="pl-12 space-y-1">
                <button onClick={() => navigate('/settings/company')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/settings/company') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Building size={16} /> Firma Bilgileri</button>
                <button onClick={() => navigate('/settings/users')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/settings/users') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Users size={16} /> Kullanıcılar</button>
                <button onClick={() => navigate('/einvoice/settings')} className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive('/einvoice/settings') ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-white'}`}><Server size={16} /> e-Dönüşüm</button>
              </div>
            )}
          </div>
        </nav>
        
        <div className="p-4 bg-slate-900/50">
           <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                       {currentUser?.name.charAt(0)}
                   </div>
                   <div>
                       <p className="font-semibold text-sm text-white truncate">{currentUser?.name}</p>
                       <p className="text-xs text-slate-400 capitalize">{currentUser?.role.toLowerCase()}</p>
                   </div>
               </div>
               <button 
                   onClick={handleLogout}
                   className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors"
                   title="Oturumu Kapat"
               >
                   <LogOut size={18} />
               </button>
           </div>
        </div>

        <div className="p-4 bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">TCMB Döviz Satış</span>
                <button onClick={refreshRates} className={`text-slate-400 hover:text-white ${ratesLoading ? 'animate-spin' : ''}`} title="Yenile"><RefreshCw size={12} /></button>
            </div>
            {ratesError ? <div className="text-xs text-red-400 flex items-center gap-1"><WifiOff size={12} /> Bağlantı Hatası</div> : currentRates ? <div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-slate-300">USD</span><span className="font-mono font-bold text-emerald-400">{currentRates.USD.toFixed(4)}</span></div><div className="flex justify-between text-sm"><span className="text-slate-300">EUR</span><span className="font-mono font-bold text-emerald-400">{currentRates.EUR.toFixed(4)}</span></div></div> : <div className="text-xs text-slate-500">Yükleniyor...</div>}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible print:block">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 print:hidden">
           <div className="flex items-center gap-2"><Wallet className="w-6 h-6 text-blue-600" /><span className="font-bold text-lg text-slate-900">KOBİ Sys</span></div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu className="text-slate-600" /></button>
        </header>
        {isMobileMenuOpen && (
           <div className="md:hidden absolute top-16 left-0 w-full bg-slate-900 text-white z-20 shadow-xl border-t border-slate-700 p-4 print:hidden">
             <nav className="space-y-4">
                <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Panel</button>
                <div className="border-l-2 border-slate-700 pl-4 space-y-2"><p className="text-xs text-slate-500 uppercase">Satışlar</p><button onClick={() => { navigate('/sales/quotes'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Teklifler</button><button onClick={() => { navigate('/sales/orders'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Siparişler</button><button onClick={() => { navigate('/sales/invoices'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Faturalar</button><button onClick={() => { navigate('/sales/customers'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Müşteriler</button></div>
                <div className="border-l-2 border-slate-700 pl-4 space-y-2"><p className="text-xs text-slate-500 uppercase">Muhasebe</p><button onClick={() => { navigate('/accounting/banks'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Bankalar & Kasalar</button><button onClick={() => { navigate('/accounting/checks'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Çek Takip</button><button onClick={() => { navigate('/sales/reconciliation'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Mutabakat</button></div>
                <div className="border-l-2 border-slate-700 pl-4 space-y-2"><p className="text-xs text-slate-500 uppercase">Depo</p><button onClick={() => { navigate('/inventory/products'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Ürün ve Hizmetler</button><button onClick={() => { navigate('/inventory/waybills'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Sevk İrsaliyeleri</button></div>
                <div className="border-l-2 border-slate-700 pl-4 space-y-2"><p className="text-xs text-slate-500 uppercase">Sistem</p><button onClick={() => { navigate('/settings/company'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Firma Bilgileri</button><button onClick={() => { navigate('/settings/users'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">Kullanıcılar</button><button onClick={() => { navigate('/einvoice/settings'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm text-slate-300">e-Dönüşüm</button></div>
             </nav>
             <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-sm font-medium">{currentUser?.name}</p>
                <button onClick={handleLogout} className="w-full text-left text-red-400 mt-2 font-medium">Çıkış Yap</button>
             </div>
           </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible print:h-auto"><div className="max-w-7xl mx-auto print:max-w-none print:w-full">{children}</div></main>
      </div>
    </div>
  );
};

export default Layout;
