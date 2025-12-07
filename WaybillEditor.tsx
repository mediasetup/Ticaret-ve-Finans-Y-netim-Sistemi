
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, User, Calendar, Truck, Plus, X, Search, FileText } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status, LineItem, Document, Customer, Product } from '../types';

const WaybillEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const { customers, products, documents, addDocument, updateDocument, addCustomer, getDocument, deleteDocument } = useSales();

  const isEditMode = !!id && id !== 'new';
  
  // Header Fields
  const [customerInput, setCustomerInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetailsText, setCustomerDetailsText] = useState(''); 
  
  const [dispatchDate, setDispatchDate] = useState<string>(new Date().toISOString().split('T')[0]); // Sevk Tarihi
  
  // Content
  const [items, setItems] = useState<Partial<LineItem>[]>([]);
  const [notes, setNotes] = useState('');

  // Invoice Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSearch, setImportSearch] = useState('');

  // Initialization Logic
  useEffect(() => {
    if (isEditMode && id) {
      const doc = getDocument(id);
      if (doc) {
        if (doc.customer) {
            setCustomerInput(doc.customer.name || '');
            setSelectedCustomerId(doc.customer.id);
            const details = [
                doc.customer.address,
                doc.customer.district && doc.customer.city ? `${doc.customer.district}/${doc.customer.city}` : '',
                doc.customer.taxOffice ? `${doc.customer.taxOffice} V.D.` : '', 
                doc.customer.taxNo ? `VKN: ${doc.customer.taxNo}` : ''
            ].filter(Boolean).join('\n');
            setCustomerDetailsText(details);
        }

        setDispatchDate(doc.date || new Date().toISOString().split('T')[0]);
        setItems(doc.items && Array.isArray(doc.items) ? JSON.parse(JSON.stringify(doc.items)) : []);
        setNotes(doc.notes || '');
      } else {
          navigate('/inventory/waybills');
      }
    } else {
      setItems([{ productId: '', sku: '', quantity: 1, unit: 'Adet', unitPrice: 0, taxRate: 20, total: 0, deliveryNote: '' }]);
    }
  }, [id, isEditMode, getDocument, navigate]);

  const filteredCustomers = customerInput.length > 0 && !selectedCustomerId 
     ? customers.filter(c => c.name.toLowerCase().includes(customerInput.toLowerCase())) 
     : [];

  // Filter Invoices for Import (Approved or Partial Shipped)
  const availableInvoices = documents
    .filter(d => d.type === DocType.INVOICE)
    .filter(d => d.customer.name.toLowerCase().includes(importSearch.toLowerCase()) || d.id.includes(importSearch));

  const handleCustomerSelect = (customer: Customer) => {
      setCustomerInput(customer.name);
      setSelectedCustomerId(customer.id);
      
      const details = [
          customer.address, 
          customer.district && customer.city ? `${customer.district}/${customer.city}` : '',
          customer.taxOffice ? `${customer.taxOffice} V.D.` : '', 
          customer.taxNo ? `VKN: ${customer.taxNo}` : ''
      ].filter(Boolean).join('\n');
      setCustomerDetailsText(details);
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomerInput(e.target.value);
      setSelectedCustomerId(null); 
  };

  const handleDelete = () => {
      if (!id) return;
      if (window.confirm('Bu irsaliyeyi silmek istediğinize emin misiniz?')) {
          deleteDocument(id);
          navigate('/inventory/waybills');
      }
  };

  const handleSave = () => {
    if (!customerInput.trim()) {
        alert('Lütfen bir müşteri seçiniz.');
        return;
    }

    if (items.length === 0) {
         alert('Lütfen en az bir satır ekleyiniz.');
         return;
    }

    let finalCustomer: Customer;
    if (selectedCustomerId) {
        finalCustomer = customers.find(c => c.id === selectedCustomerId)!;
    } else {
        finalCustomer = {
            id: `CUST-${Date.now()}`,
            name: customerInput,
            email: '',
            taxNo: '',
            isLegalEntity: false
        };
        addCustomer(finalCustomer); 
    }

    const processedItems: LineItem[] = [];
    for (const item of items) {
        if (!item.productName) continue;

        processedItems.push({
            ...item,
            productId: item.productId || '',
            productName: item.productName!,
            sku: item.sku || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'Adet',
            // Pricing is usually 0 or hidden on waybills in some contexts, but we keep structure
            unitPrice: item.unitPrice || 0,
            taxRate: item.taxRate || 0,
            discount: 0,
            total: 0, 
            deliveryNote: item.deliveryNote
        } as LineItem);
    }

    const newDoc: Document = {
      id: isEditMode && id ? id : `IRS-${Math.floor(Math.random() * 10000)}`,
      type: DocType.WAYBILL,
      customer: finalCustomer,
      date: dispatchDate,
      createdAt: isEditMode && id ? (getDocument(id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      currency: 'TRY', // Default for waybill
      totalAmount: 0, // Not relevant for waybill usually
      items: processedItems,
      status: Status.SHIPPED,
      notes,
    };

    if (isEditMode) {
        updateDocument(newDoc);
        alert('İrsaliye güncellendi.');
    } else {
        addDocument(newDoc);
        alert('İrsaliye oluşturuldu.');
    }
    
    navigate('/inventory/waybills');
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    (item as any)[field] = value;
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
      setItems([...items, { productId: '', sku: '', quantity: 1, unit: 'Adet', unitPrice: 0, taxRate: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
  };

  const handleImportInvoice = (invoice: Document) => {
      // Set customer if not set
      if (!selectedCustomerId) {
          handleCustomerSelect(invoice.customer);
      } else if (selectedCustomerId !== invoice.customer.id) {
          if (!window.confirm("Seçili müşteri ile fatura müşterisi farklı. Fatura müşterisi ile değiştirilsin mi?")) {
              return;
          }
          handleCustomerSelect(invoice.customer);
      }

      // Append items
      const newItems = invoice.items.map(i => ({
          productId: i.productId,
          sku: i.sku,
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: 0, // Reset price for waybill context usually
          taxRate: 0,
          total: 0
      }));

      setItems([...items.filter(i => i.productName), ...newItems]);
      setIsImportModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between sticky top-0 bg-slate-50 py-4 z-10 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inventory/waybills')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Truck className="text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">{isEditMode ? 'İrsaliye Düzenle' : 'Yeni Sevk İrsaliyesi'}</h2>
          </div>
        </div>
        <div className="flex gap-2">
            {!isEditMode && (
                <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 transition-colors font-medium mr-4"
                >
                    <FileText size={18} /> Faturadan Aktar
                </button>
            )}
            {isEditMode && (
                <button 
                    onClick={handleDelete}
                    className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2 mr-2 transition-colors"
                >
                    <Trash2 size={18} /> SİL
                </button>
            )}
            <button onClick={() => navigate('/inventory/waybills')} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50">
                VAZGEÇ
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 shadow-sm font-medium">
                <Save size={18} />
                KAYDET
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 space-y-6">
           
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                      <User size={14}/> Müşteri <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                      <input 
                          type="text"
                          className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-gray-900 placeholder-gray-500 ${!customerInput ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="Müşteri adı..."
                          value={customerInput}
                          onChange={handleCustomerInputChange}
                      />
                      {filteredCustomers.length > 0 && (
                          <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 z-50 max-h-48 overflow-y-auto">
                              {filteredCustomers.map(c => (
                                  <div key={c.id} onClick={() => handleCustomerSelect(c)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none">
                                      <div className="font-medium text-slate-800">{c.name}</div>
                                      <div className="text-xs text-slate-500">{c.taxNo || 'Bireysel'}</div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
              
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-1">
                      Müşteri Detayları
                  </label>
                  <div className="w-full border border-gray-300 rounded-lg p-2.5 text-sm h-[88px] bg-white overflow-y-auto whitespace-pre-line text-gray-600">
                      {customerDetailsText || <span className="text-slate-400 italic">Müşteri seçildiğinde detaylar burada görünecek...</span>}
                  </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sevk Tarihi</label>
                   <div className="relative">
                       <input 
                         type="date"
                         className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                         value={dispatchDate}
                         onChange={(e) => setDispatchDate(e.target.value)}
                       />
                       <Calendar className="absolute right-3 top-2.5 text-gray-400 w-5 h-5 pointer-events-none" />
                   </div>
                </div>
           </div>

           <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İrsaliye Notları</label>
               <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-sm bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Şoför, plaka vb..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
               />
           </div>
        </div>

        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-700">Sevk Edilecek Ürünler</h3>
            </div>
            
            <table className="w-full text-left text-sm mb-4">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                        <th className="px-3 py-2 rounded-l-lg w-[20%]">Stok Kodu (SKU)</th>
                        <th className="px-3 py-2 w-[40%]">Ürün / Hizmet Adı</th>
                        <th className="px-3 py-2 w-[15%]">Miktar</th>
                        <th className="px-3 py-2 w-[15%]">Birim</th>
                        <th className="px-3 py-2 w-[10%] rounded-r-lg"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                        <tr key={index} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-3 align-top">
                                <input 
                                    type="text" 
                                    className="w-full font-mono text-sm text-blue-600 bg-white border border-gray-200 rounded px-2 py-1 focus:border-blue-500 outline-none placeholder-gray-400"
                                    placeholder="SKU..."
                                    value={item.sku || ''}
                                    onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                />
                            </td>
                            <td className="px-3 py-3 align-top">
                                <input 
                                    type="text" 
                                    className="w-full font-medium text-slate-900 bg-white border border-gray-200 rounded px-2 py-1 focus:border-blue-500 outline-none placeholder-gray-400"
                                    placeholder="Ürün adı..."
                                    value={item.productName || ''}
                                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                                />
                            </td>
                            <td className="px-3 py-3 align-top">
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-center focus:ring-1 focus:ring-blue-500 outline-none text-slate-900"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                />
                            </td>
                            <td className="px-3 py-3 align-top">
                                <select 
                                    className="w-full bg-white border-none text-xs text-slate-600 focus:ring-0 cursor-pointer"
                                    value={item.unit}
                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                >
                                    <option value="Adet">Adet</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Metre">Metre</option>
                                    <option value="Kutu">Kutu</option>
                                    <option value="Saat">Saat</option>
                                </select>
                            </td>
                            <td className="px-3 py-3 align-top text-center">
                                <button 
                                    onClick={() => removeItem(index)}
                                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button 
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium w-full justify-center"
            >
                <Plus size={16} /> YENİ SATIR EKLE
            </button>
        </div>
      </div>

      {/* IMPORT FROM INVOICE MODAL */}
      {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <FileText size={20} className="text-purple-600" />
                          Faturadan Ürün Çek
                      </h3>
                      <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input 
                              type="text" 
                              placeholder="Fatura No veya Müşteri Ara..." 
                              value={importSearch}
                              onChange={(e) => setImportSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                          />
                      </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto">
                      {availableInvoices.length === 0 ? (
                          <div className="p-8 text-center text-slate-500">Kayıt bulunamadı.</div>
                      ) : (
                          <div className="divide-y divide-slate-100">
                              {availableInvoices.map(inv => (
                                  <div key={inv.id} className="p-4 hover:bg-purple-50 flex justify-between items-center group cursor-pointer" onClick={() => handleImportInvoice(inv)}>
                                      <div>
                                          <div className="font-bold text-slate-800">{inv.customer.name}</div>
                                          <div className="text-xs text-slate-500 flex gap-2">
                                              <span>{inv.id}</span>
                                              <span>•</span>
                                              <span>{inv.date}</span>
                                              <span>•</span>
                                              <span>{inv.items.length} Kalem</span>
                                          </div>
                                      </div>
                                      <button className="px-3 py-1.5 bg-white border border-purple-200 text-purple-600 rounded text-sm font-medium hover:bg-purple-600 hover:text-white transition-colors">
                                          Seç
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default WaybillEditor;
