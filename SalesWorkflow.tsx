
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DocType, Status } from '../types';
import { FileText, Truck, Receipt, Plus, Eye, Search, Pencil, Filter } from 'lucide-react';
import { useSales } from '../context/SalesContext';

const SalesWorkflow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { documents } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Determine Type based on URL
  const getActiveType = (): DocType => {
    if (location.pathname.includes('/orders')) return DocType.ORDER;
    if (location.pathname.includes('/invoices')) return DocType.INVOICE;
    return DocType.QUOTE;
  };

  const activeType = getActiveType();
  
  // State for Status Filter Tabs
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');

  // Reset status tab when switching pages
  useEffect(() => {
    setActiveStatusTab('ALL');
  }, [location.pathname]);

  const getStatusTabs = (type: DocType) => {
    const common = [{ id: 'ALL', label: 'Tümü' }];
    switch (type) {
        case DocType.QUOTE:
            return [...common, 
                { id: Status.PENDING, label: 'Cevap Bekleyenler' }, 
                { id: Status.APPROVED, label: 'Onaylananlar' }, 
                { id: Status.REJECTED, label: 'Reddedilenler' }
            ];
        case DocType.ORDER:
            return [...common,
                { id: Status.PENDING, label: 'Onay Bekleyen' },
                { id: Status.SHIPPED, label: 'Sevk Edilen' },
                { id: Status.PARTIAL, label: 'Kısmi Sevk' },
                { id: Status.INVOICED, label: 'Faturalanan' }
            ];
        case DocType.INVOICE:
            return [...common,
                { id: Status.INVOICED, label: 'Faturalandı' },
                { id: Status.PAID, label: 'Ödendi' }
            ];
        default: return common;
    }
  };

  // Filter Logic
  const filteredDocs = documents.filter(doc => {
    const matchesType = doc.type === activeType;
    const matchesSearch = doc.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (activeStatusTab !== 'ALL') {
        matchesStatus = doc.status === activeStatusTab;
    }

    return matchesType && matchesSearch && matchesStatus;
  });

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'TRY': default: return '₺';
    }
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeType === DocType.QUOTE) {
        navigate(`/sales/quote/${id}`);
    } else if (activeType === DocType.ORDER) {
        navigate(`/sales/order/edit/${id}`);
    }
  };

  const handleRowClick = (id: string) => {
    if (activeType === DocType.QUOTE) {
      navigate(`/sales/quote/view/${id}`);
    } else if (activeType === DocType.ORDER) {
      navigate(`/sales/order/${id}`);
    } else if (activeType === DocType.INVOICE) {
      navigate(`/sales/invoice/${id}`);
    }
  };

  const getPageTitle = () => {
      switch(activeType) {
          case DocType.QUOTE: return 'Teklifler';
          case DocType.ORDER: return 'Siparişler';
          case DocType.INVOICE: return 'Faturalar';
          default: return 'Satışlar';
      }
  };

  const handleNewClick = () => {
      if (activeType === DocType.QUOTE) {
          navigate('/sales/quote/new');
      } else if (activeType === DocType.ORDER) {
          navigate('/sales/order/new');
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{getPageTitle()}</h2>
            <p className="text-slate-500">
                {activeType === DocType.QUOTE && 'Müşterilere sunulan teklifleri yönetin'}
                {activeType === DocType.ORDER && 'Gelen siparişleri ve sevkiyat durumunu takip edin'}
                {activeType === DocType.INVOICE && 'Kesilen faturaları ve ödeme durumlarını izleyin'}
            </p>
          </div>
          {activeType !== DocType.INVOICE && (
            <button 
                onClick={handleNewClick}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
                <Plus size={18} />
                {activeType === DocType.QUOTE ? 'Yeni Teklif Oluştur' : 'Yeni Sipariş Oluştur'}
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="border-b border-slate-200">
            <div className="flex gap-4 overflow-x-auto pb-1">
                {getStatusTabs(activeType).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveStatusTab(tab.id)}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                            activeStatusTab === tab.id 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative w-full md:w-80">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Belge No veya Müşteri Ara..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50">
              <Filter size={16} /> Filtrele
          </button>
        </div>

        {/* List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredDocs.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => handleRowClick(doc.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-600">{doc.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                      doc.status === Status.APPROVED || doc.status === Status.INVOICED || doc.status === Status.SHIPPED || doc.status === Status.PAID ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      doc.status === Status.PENDING ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      doc.status === Status.PARTIAL ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      doc.status === Status.REJECTED || doc.status === Status.CANCELLED ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {doc.status}
                    </span>
                    <span className="text-xs text-slate-400">• {doc.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.customer.name}</h3>
                  <div className="flex gap-4 mt-1">
                      <p className="text-sm text-slate-500">
                        {doc.items.length} Kalem
                      </p>
                      {doc.paymentDueDate && (
                          <p className="text-sm text-slate-500">
                              Vade: {doc.paymentDueDate}
                          </p>
                      )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Toplam Tutar</p>
                    <p className="text-lg font-bold text-slate-900">{getCurrencySymbol(doc.currency)}{doc.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(doc.type === DocType.QUOTE || doc.type === DocType.ORDER) && (
                       <button 
                         onClick={(e) => handleEditClick(e, doc.id)}
                         className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                         title="Düzenle"
                       >
                         <Pencil size={18} />
                       </button>
                    )}
                    <button 
                      className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                      title="Görüntüle"
                    >
                      <Eye size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredDocs.length === 0 && (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                 {activeType === DocType.QUOTE && <FileText className="w-12 h-12 text-slate-300 mb-2" />}
                 {activeType === DocType.ORDER && <Truck className="w-12 h-12 text-slate-300 mb-2" />}
                 {activeType === DocType.INVOICE && <Receipt className="w-12 h-12 text-slate-300 mb-2" />}
                 <p>Bu filtrede kayıt bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default SalesWorkflow;
