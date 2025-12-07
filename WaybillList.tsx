
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocType, Status } from '../types';
import { Truck, Plus, Eye, Search, Pencil, Filter } from 'lucide-react';
import { useSales } from '../context/SalesContext';

const WaybillList = () => {
  const navigate = useNavigate();
  const { documents } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter only Waybills
  const waybills = documents.filter(doc => doc.type === DocType.WAYBILL);

  const filteredDocs = waybills.filter(doc => {
    const matchesSearch = doc.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/inventory/waybill/${id}`);
  };

  const handleNewClick = () => {
      navigate('/inventory/waybill/new');
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Sevk İrsaliyeleri</h2>
            <p className="text-slate-500">
                Depo çıkışları ve sevk irsaliyelerini yönetin
            </p>
          </div>
          <button 
                onClick={handleNewClick}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
                <Plus size={18} />
                Yeni Sevk İrsaliyesi
            </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative w-full md:w-80">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="İrsaliye No veya Müşteri Ara..." 
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
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex text-xs font-bold text-slate-500 uppercase">
                <div className="flex-1">İrsaliye Bilgileri</div>
                <div className="w-32 text-center">Tarih</div>
                <div className="w-24 text-center">Kalem</div>
                <div className="w-32 text-right">İşlem</div>
            </div>
            {filteredDocs.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => handleEditClick({ stopPropagation: () => {} } as any, doc.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-600">{doc.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200`}>
                      {doc.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.customer.name}</h3>
                </div>

                <div className="w-32 text-center text-sm text-slate-600">
                    {doc.date}
                </div>

                <div className="w-24 text-center text-sm font-medium text-slate-800">
                    {doc.items.length} Kalem
                </div>
                
                <div className="w-32 flex justify-end gap-2">
                    <button 
                        onClick={(e) => handleEditClick(e, doc.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Düzenle"
                    >
                        <Pencil size={18} />
                    </button>
                </div>
              </div>
            ))}
            
            {filteredDocs.length === 0 && (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                 <Truck className="w-12 h-12 text-slate-300 mb-2" />
                 <p>Kayıt bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default WaybillList;
