
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Users, MapPin, Phone, Building2, Wallet, Download, Eye, X, User, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSales } from '../context/SalesContext';
import { Customer, DocType, Status } from '../types';

const CustomerList = () => {
  const navigate = useNavigate();
  const { customers, documents, payments, addCustomer, updateCustomer, deleteCustomer } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBalance, setFilterBalance] = useState<string>('ALL'); // ALL, DEBTOR, CREDITOR, ZERO
  const [filterCity, setFilterCity] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    taxNo: '',
    taxOffice: '',
    isLegalEntity: true
  });

  // Extract unique cities
  const cities = useMemo(() => {
    const citySet = new Set(customers.map(c => c.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [customers]);

  // Dynamic Balance Calculation
  const customerStats = useMemo(() => {
    const stats: Record<string, { totalOrders: number; balance: number }> = {};
    
    customers.forEach(c => {
      stats[c.id] = { totalOrders: 0, balance: 0 };
    });

    // Add Debts (Invoices)
    documents.forEach(doc => {
      if (stats[doc.customer.id] && doc.type === DocType.INVOICE) {
         stats[doc.customer.id].totalOrders += doc.totalAmount;
         stats[doc.customer.id].balance += doc.totalAmount; // Add to debt
      }
    });

    // Subtract Payments (Collections)
    payments.forEach(pay => {
        if (stats[pay.customerId]) {
            stats[pay.customerId].balance -= pay.amount;
        }
    });

    return stats;
  }, [customers, documents, payments]);

  // Filtering
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.taxNo?.includes(searchTerm);
    
    let matchesBalance = true;
    const balance = customerStats[c.id]?.balance || 0;

    if (filterBalance === 'DEBTOR') matchesBalance = balance > 0;
    if (filterBalance === 'ZERO') matchesBalance = balance === 0;
    
    let matchesCity = true;
    if (filterCity !== 'ALL') matchesCity = c.city === filterCity;

    return matchesSearch && matchesBalance && matchesCity;
  });

  const handleOpenModal = (customer?: Customer) => {
      if (customer) {
          setEditingId(customer.id);
          setCustomerForm({ ...customer });
      } else {
          setEditingId(null);
          setCustomerForm({ name: '', isLegalEntity: true, city: '', district: '', address: '', phone: '', email: '', taxNo: '', taxOffice: '' });
      }
      setIsModalOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!customerForm.name) {
        alert('İsim zorunludur.');
        return;
    }
    
    if (editingId) {
        updateCustomer(editingId, customerForm);
    } else {
        const customer: Customer = {
            id: `CUST-${Date.now()}`,
            name: customerForm.name,
            email: customerForm.email || '',
            ...customerForm as any,
            // Ensure taxOffice is empty if individual
            taxOffice: customerForm.isLegalEntity ? customerForm.taxOffice : ''
        };
        addCustomer(customer);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) {
          const success = deleteCustomer(id);
          if (!success) {
              alert("Bu müşteri silinemez çünkü teklif, sipariş veya fatura kaydı mevcuttur.");
          }
      }
  };

  const handleExportExcel = () => {
    // Generate CSV content
    const headers = ['Müşteri Adı', 'Türü', 'Vergi/TC No', 'Şehir', 'Telefon', 'Toplam Hacim', 'Güncel Bakiye'];
    const rows = filteredCustomers.map(c => {
        const stats = customerStats[c.id];
        return [
            `"${c.name}"`,
            `"${c.isLegalEntity ? 'Kurumsal' : 'Bireysel'}"`,
            `"${c.taxNo || ''}"`,
            `"${c.city || ''}"`,
            `"${c.phone || ''}"`,
            stats?.totalOrders || 0,
            stats?.balance || 0
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "musteri_listesi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Müşteri Yönetimi</h2>
          <p className="text-slate-500">Cari kartlar, bakiye durumları ve iletişim bilgileri</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          Yeni Müşteri Oluştur
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Müşteri adı, VKN veya şehir ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm min-w-[140px]"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
            >
                <option value="ALL">Tüm Şehirler</option>
                {cities.map(city => <option key={city} value={city as string}>{city}</option>)}
            </select>

            <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={filterBalance}
                onChange={(e) => setFilterBalance(e.target.value)}
            >
                <option value="ALL">Tüm Bakiyeler</option>
                <option value="DEBTOR">Borçlu Müşteriler</option>
                <option value="ZERO">Bakiyesi Sıfır Olanlar</option>
            </select>

            <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-slate-600 bg-white hover:bg-slate-50 font-medium text-sm"
                title="Excel Olarak İndir"
            >
                <Download size={16} /> <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Müşteri / Cari</th>
                <th className="px-6 py-4 font-semibold">İletişim</th>
                <th className="px-6 py-4 font-semibold">Lokasyon</th>
                <th className="px-6 py-4 font-semibold text-right">Toplam Hacim</th>
                <th className="px-6 py-4 font-semibold text-right">Güncel Bakiye</th>
                <th className="px-6 py-4 font-semibold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => {
                const stats = customerStats[customer.id] || { balance: 0, totalOrders: 0 };
                return (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-slate-50 group transition-colors cursor-pointer"
                    onClick={() => navigate(`/sales/customers/${customer.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${customer.isLegalEntity ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {customer.isLegalEntity ? <Building2 size={20} /> : <User size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{customer.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                             <span className={`px-1.5 py-0.5 rounded text-[10px] border ${customer.isLegalEntity ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
                                {customer.isLegalEntity ? 'Kurumsal' : 'Bireysel'}
                             </span>
                             {customer.taxNo ? `${customer.isLegalEntity ? 'VKN' : 'TCKN'}: ${customer.taxNo}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone size={14} className="text-slate-400"/> {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="text-xs text-slate-500">{customer.email}</div>
                        )}
                        {!customer.phone && !customer.email && <span className="text-slate-400 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={14} className="text-slate-400"/>
                        <span>{customer.city || '-'}{customer.district ? `, ${customer.district}` : ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="font-medium text-slate-700">
                         ₺{stats.totalOrders.toLocaleString()}
                       </div>
                       <div className="text-xs text-slate-400">Toplam Fatura</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className={`font-bold ${stats.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                         ₺{stats.balance.toLocaleString()}
                       </div>
                       <div className="text-xs text-slate-400">
                         {stats.balance > 0 ? 'Ödeme Bekliyor' : 'Borcu Yok'}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleOpenModal(customer); }}
                             className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50"
                             title="Düzenle"
                           >
                             <Pencil size={18} />
                           </button>
                           <button 
                             onClick={(e) => handleDeleteCustomer(e, customer.id)}
                             className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50"
                             title="Sil"
                           >
                             <Trash2 size={18} />
                           </button>
                           <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50" title="Detay">
                             <Eye size={18} />
                           </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredCustomers.length === 0 && (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
               <Wallet className="w-12 h-12 text-slate-300 mb-3" />
               <p className="font-medium">Kayıt bulunamadı.</p>
               <p className="text-sm">Arama kriterlerinizi değiştirin veya yeni müşteri ekleyin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">{editingId ? 'Müşteri Kartını Düzenle' : 'Yeni Müşteri Kartı'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Customer Type Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                        <button 
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${customerForm.isLegalEntity ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setCustomerForm({...customerForm, isLegalEntity: true})}
                        >
                            Kurumsal (Firma)
                        </button>
                        <button 
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!customerForm.isLegalEntity ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setCustomerForm({...customerForm, isLegalEntity: false})}
                        >
                            Bireysel (Şahıs)
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            {customerForm.isLegalEntity ? 'Firma Ünvanı *' : 'Ad Soyad *'}
                        </label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-500" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} placeholder={customerForm.isLegalEntity ? "Örn: Yılmaz İnşaat A.Ş." : "Örn: Ahmet Yılmaz"} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-Posta</label>
                            <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adres</label>
                        <textarea className="w-full border border-gray-300 rounded-lg p-2.5 outline-none h-20 resize-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İlçe</label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" value={customerForm.district} onChange={e => setCustomerForm({...customerForm, district: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İl</label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" value={customerForm.city} onChange={e => setCustomerForm({...customerForm, city: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {customerForm.isLegalEntity && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vergi Dairesi</label>
                                <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" value={customerForm.taxOffice} onChange={e => setCustomerForm({...customerForm, taxOffice: e.target.value})} />
                            </div>
                        )}
                         <div className={!customerForm.isLegalEntity ? 'col-span-2' : ''}>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                {customerForm.isLegalEntity ? 'Vergi No (VKN)' : 'TC Kimlik No (TCKN)'}
                            </label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" value={customerForm.taxNo} onChange={e => setCustomerForm({...customerForm, taxNo: e.target.value})} />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Vazgeç</button>
                    <button onClick={handleSaveCustomer} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm">Kaydet</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
