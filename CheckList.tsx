
import React, { useState, useMemo } from 'react';
import { useSales } from '../context/SalesContext';
import { Search, Filter, Plus, Calendar, Building2, User, ArrowUpRight, CheckCircle2, AlertTriangle, XCircle, CreditCard, Clock } from 'lucide-react';
import { Check } from '../types';

const CheckList = () => {
  const { checks, customers, updateCheck } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Bilinmeyen Cari';

  const filteredChecks = useMemo(() => {
    return checks.filter(check => {
      const matchesSearch = 
        check.checkNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        check.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.drawer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCustomerName(check.customerId).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || check.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [checks, searchTerm, statusFilter, customers]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: checks.reduce((sum, c) => sum + c.amount, 0),
      collected: checks.filter(c => c.status === 'COLLECTED').reduce((sum, c) => sum + c.amount, 0),
      pending: checks.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0),
      bounced: checks.filter(c => c.status === 'BOUNCED').reduce((sum, c) => sum + c.amount, 0),
    };
  }, [checks]);

  const handleStatusChange = async (check: Check, newStatus: Check['status']) => {
    if (window.confirm(`Çek durumunu "${newStatus}" olarak değiştirmek istediğinize emin misiniz?`)) {
      await updateCheck({ ...check, status: newStatus });
    }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'PENDING': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock size={12}/> Portföyde</span>;
          case 'COLLECTED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 size={12}/> Tahsil Edildi</span>;
          case 'BOUNCED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12}/> Karşılıksız</span>;
          case 'RETURNED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><ArrowUpRight size={12}/> İade Edildi</span>;
          default: return null;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Çek Takip Sistemi</h2>
          <p className="text-slate-500">Müşteri çekleri, vadeler ve tahsilat durumu</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start">
                 <div>
                     <p className="text-xs font-bold text-slate-500 uppercase mb-1">Toplam Portföy</p>
                     <h3 className="text-xl font-bold text-slate-800">₺{stats.total.toLocaleString()}</h3>
                 </div>
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CreditCard size={20}/></div>
             </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start">
                 <div>
                     <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tahsil Edilen</p>
                     <h3 className="text-xl font-bold text-emerald-600">₺{stats.collected.toLocaleString()}</h3>
                 </div>
                 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={20}/></div>
             </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start">
                 <div>
                     <p className="text-xs font-bold text-slate-500 uppercase mb-1">Bekleyen (Vadesi Gelmemiş)</p>
                     <h3 className="text-xl font-bold text-amber-600">₺{stats.pending.toLocaleString()}</h3>
                 </div>
                 <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20}/></div>
             </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start">
                 <div>
                     <p className="text-xs font-bold text-slate-500 uppercase mb-1">Karşılıksız / İade</p>
                     <h3 className="text-xl font-bold text-red-600">₺{stats.bounced.toLocaleString()}</h3>
                 </div>
                 <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={20}/></div>
             </div>
         </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Çek No, Banka veya Cari Ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <select 
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full md:w-48"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
             >
                <option value="ALL">Tüm Durumlar</option>
                <option value="PENDING">Bekleyen (Portföy)</option>
                <option value="COLLECTED">Tahsil Edilen</option>
                <option value="BOUNCED">Karşılıksız</option>
                <option value="RETURNED">İade Edilen</option>
             </select>
             <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium">
                <Filter size={16} /> Filtrele
             </button>
          </div>
      </div>

      {/* Checks Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
         <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
               <tr>
                  <th className="px-6 py-4">Vade Tarihi</th>
                  <th className="px-6 py-4">Çek No / Banka</th>
                  <th className="px-6 py-4">Cari / Keşideci</th>
                  <th className="px-6 py-4 text-right">Tutar</th>
                  <th className="px-6 py-4 text-center">Durum</th>
                  <th className="px-6 py-4 text-center">İşlem</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredChecks.length === 0 ? (
                   <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
               ) : (
                   filteredChecks.map(check => (
                       <tr key={check.id} className="hover:bg-slate-50 group">
                           <td className="px-6 py-4 font-mono font-medium text-slate-700">
                               <div className="flex items-center gap-2">
                                   <Calendar size={14} className="text-slate-400"/>
                                   {check.dueDate}
                               </div>
                           </td>
                           <td className="px-6 py-4">
                               <div className="font-bold text-slate-800">{check.checkNumber}</div>
                               <div className="text-xs text-slate-500 flex items-center gap-1">
                                   <Building2 size={12}/> {check.bankName}
                               </div>
                           </td>
                           <td className="px-6 py-4">
                               <div className="font-medium text-blue-600">{getCustomerName(check.customerId)}</div>
                               <div className="text-xs text-slate-500 flex items-center gap-1">
                                   <User size={12}/> {check.drawer}
                               </div>
                           </td>
                           <td className="px-6 py-4 text-right font-bold text-slate-800">
                               {check.amount.toLocaleString(undefined, {minimumFractionDigits: 2})} {check.currency}
                           </td>
                           <td className="px-6 py-4 text-center">
                               {getStatusBadge(check.status)}
                           </td>
                           <td className="px-6 py-4 text-center">
                               {check.status === 'PENDING' && (
                                   <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button 
                                          onClick={() => handleStatusChange(check, 'COLLECTED')}
                                          className="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded text-xs font-bold border border-emerald-200"
                                          title="Tahsil Et"
                                       >
                                           Tahsil
                                       </button>
                                       <button 
                                          onClick={() => handleStatusChange(check, 'BOUNCED')}
                                          className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-200"
                                          title="Karşılıksız İşaretle"
                                       >
                                           Karşılıksız
                                       </button>
                                   </div>
                               )}
                           </td>
                       </tr>
                   ))
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default CheckList;
