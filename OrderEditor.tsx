
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, User, Calendar, Truck, Search, Plus, X } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status, Currency, LineItem, Document, Customer, Product } from '../types';

const OrderEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const { customers, products, addDocument, updateDocument, addCustomer, addProduct, getDocument, deleteDocument, currentRates } = useSales();

  const isEditMode = !!id;
  
  const [customerInput, setCustomerInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetailsText, setCustomerDetailsText] = useState(''); 
  
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentDueDate, setPaymentDueDate] = useState<string>(''); 
  
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  
  const [items, setItems] = useState<Partial<LineItem>[]>([]);
  const [notes, setNotes] = useState('');

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

        setIssueDate(doc.date || new Date().toISOString().split('T')[0]);
        setCurrency(doc.currency || 'TRY');
        setExchangeRate(doc.exchangeRate || 1.0);
        
        setItems(doc.items && Array.isArray(doc.items) ? JSON.parse(JSON.stringify(doc.items)) : []);
        
        setNotes(doc.notes || '');
        setPaymentDueDate(doc.paymentDueDate || '');
      } else {
          navigate('/sales/orders');
      }
    } else {
      setItems([{ productId: '', sku: '', quantity: 1, unit: 'Adet', discount: 0, unitPrice: 0, taxRate: 20, total: 0, deliveryNote: '' }]);
      setPaymentDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [id, isEditMode, getDocument, navigate]);

  // AUTO-UPDATE EXCHANGE RATE FROM TCMB
  useEffect(() => {
     if (currency === 'TRY') {
         setExchangeRate(1.0);
     } else if (currency === 'USD') {
         setExchangeRate(currentRates?.USD || 32.50); 
     } else if (currency === 'EUR') {
         setExchangeRate(currentRates?.EUR || 35.20); 
     }
  }, [currency, currentRates]);

  const filteredCustomers = customerInput.length > 0 && !selectedCustomerId 
     ? customers.filter(c => c.name.toLowerCase().includes(customerInput.toLowerCase())) 
     : [];

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
      if (window.confirm('Bu siparişi silmek istediğinize emin misiniz?')) {
          deleteDocument(id);
          navigate('/sales/orders');
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

        let finalProductId = item.productId;
        
        if (!finalProductId && item.productName) {
            const existing = products.find(p => p.name.toLowerCase() === item.productName?.toLowerCase());
            if (existing) {
                finalProductId = existing.id;
            } else {
                const newProduct: Product = {
                    id: `PROD-${Math.floor(Math.random() * 100000)}`,
                    name: item.productName,
                    sku: item.sku || `AUTO-${Math.floor(Math.random() * 1000)}`,
                    stock: 0,
                    price: item.unitPrice || 0,
                    cost: (item.unitPrice || 0) * 0.7,
                    category: 'Genel',
                    lastRestockDate: new Date().toISOString().split('T')[0],
                    currency: currency // Use current doc currency as base
                };
                addProduct(newProduct);
                finalProductId = newProduct.id;
            }
        }

        processedItems.push({
            ...item,
            productId: finalProductId || '',
            productName: item.productName!,
            sku: item.sku || '', // Save SKU
            quantity: item.quantity || 1,
            unit: item.unit || 'Adet',
            unitPrice: item.unitPrice || 0,
            taxRate: item.taxRate || 20,
            discount: item.discount || 0,
            total: item.total || 0,
            deliveryNote: item.deliveryNote
        } as LineItem);
    }

    const totalAmount = processedItems.reduce((sum, i) => sum + (i.total || 0), 0);
    
    const newDoc: Document = {
      id: isEditMode && id ? id : `SIP-${Math.floor(Math.random() * 10000)}`,
      type: DocType.ORDER,
      customer: finalCustomer,
      date: issueDate,
      createdAt: isEditMode && id ? (getDocument(id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      paymentDueDate: paymentDueDate || undefined,
      currency,
      exchangeRate,
      items: processedItems,
      totalAmount,
      status: isEditMode && id ? (getDocument(id)?.status || Status.PENDING) : Status.PENDING,
      notes,
    };

    if (isEditMode) {
        updateDocument(newDoc);
        alert('Sipariş güncellendi.');
    } else {
        addDocument(newDoc);
        alert('Sipariş oluşturuldu.');
    }
    
    // Redirect to Detail View instead of List
    navigate(`/sales/order/${newDoc.id}`);
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    // SKU BASED SEARCH
    if (field === 'sku') {
        item.sku = value;
        // Search in products by SKU
        const existing = products.find(p => p.sku.toLowerCase() === value.toLowerCase());
        if (existing) {
            item.productId = existing.id;
            item.productName = existing.name;
            item.unit = existing.unit;
            item.taxRate = existing.vatRate || 20;
            // Set price based on currency
            item.unitPrice = currency === 'TRY' ? existing.price : (existing.price / exchangeRate);
        }
    } 
    // NAME BASED SEARCH (Fallback)
    else if (field === 'productName') {
        item.productName = value;
        const existing = products.find(p => p.name.toLowerCase() === value.toLowerCase());
        if (existing) {
            item.productId = existing.id;
            item.sku = existing.sku;
            item.unit = existing.unit;
            item.taxRate = existing.vatRate || 20;
            item.unitPrice = currency === 'TRY' ? existing.price : (existing.price / exchangeRate);
        } else {
            item.productId = '';
            // Don't clear SKU if user just typed a custom name, but decouple ID
        }
    } else {
      (item as any)[field] = value;
    }

    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    const discount = item.discount || 0;
    item.total = (qty * price) * (1 - discount / 100);

    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
      setItems([...items, { productId: '', sku: '', quantity: 1, unit: 'Adet', unitPrice: 0, taxRate: 20, discount: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between sticky top-0 bg-slate-50 py-4 z-10 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/orders')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Truck className="text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Sipariş Düzenle' : 'Yeni Sipariş'}</h2>
          </div>
        </div>
        <div className="flex gap-2">
            {isEditMode && (
                <button 
                    onClick={handleDelete}
                    className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2 mr-2 transition-colors"
                >
                    <Trash2 size={18} /> SİL
                </button>
            )}
            <button onClick={() => navigate('/sales/orders')} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50">
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
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sipariş Tarihi</label>
                   <div className="relative">
                       <input 
                         type="date"
                         className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                         value={issueDate}
                         onChange={(e) => setIssueDate(e.target.value)}
                       />
                       <Calendar className="absolute right-3 top-2.5 text-gray-400 w-5 h-5 pointer-events-none" />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teslimat / Termin</label>
                   <input 
                     type="date"
                     className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                     value={paymentDueDate}
                     onChange={(e) => setPaymentDueDate(e.target.value)}
                   />
                </div>
           </div>
           
           <div className="flex gap-4">
                <div className="w-1/3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Döviz</label>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white">
                        {(['TRY', 'USD', 'EUR'] as Currency[]).map(c => (
                            <button
                                key={c}
                                onClick={() => setCurrency(c)}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${currency === c ? 'bg-slate-800 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-1/3">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kur (TCMB)</label>
                     <input 
                        type="number"
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                        step="0.0001"
                     />
                     <div className="text-[10px] text-slate-400 mt-1">
                         {currency !== 'TRY' ? `Otomatik: ${currentRates?.date || 'N/A'}` : 'Sabit'}
                     </div>
                </div>
           </div>

           <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sipariş Notları</label>
               <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-sm bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Teslimat talimatları vb..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
               />
           </div>
        </div>

        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-700">Ürün / Hizmetler</h3>
                 <span className="text-xs text-slate-500">Miktarları ve fiyatları düzenleyebilirsiniz.</span>
            </div>
            
            <table className="w-full text-left text-sm mb-4">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                        <th className="px-3 py-2 rounded-l-lg w-[15%]">Stok Kodu (SKU)</th>
                        <th className="px-3 py-2 w-[25%]">Ürün / Hizmet Adı</th>
                        <th className="px-3 py-2 w-[10%]">Miktar</th>
                        <th className="px-3 py-2 w-[10%]">Birim</th>
                        <th className="px-3 py-2 w-[15%]">Br. Fiyat</th>
                        <th className="px-3 py-2 w-[10%]">Vergi</th>
                        <th className="px-3 py-2 w-[10%] text-right">Toplam</th>
                        <th className="px-3 py-2 w-[5%] rounded-r-lg"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                        <tr key={index} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-3 align-top">
                                <input 
                                    type="text" 
                                    className="w-full font-mono text-sm text-blue-600 bg-white border border-gray-200 rounded px-2 py-1 focus:border-blue-500 outline-none placeholder-gray-400"
                                    placeholder="SKU giriniz..."
                                    value={item.sku || ''}
                                    onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                />
                            </td>
                            <td className="px-3 py-3 align-top">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full font-medium text-slate-900 bg-white border-b border-transparent focus:border-blue-500 outline-none placeholder-gray-400"
                                        placeholder="Ürün adı..."
                                        value={item.productName || ''}
                                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                                    />
                                    <div className="mt-1">
                                        <input 
                                            type="text"
                                            className="w-full text-xs text-slate-600 bg-white border-b border-transparent focus:border-blue-300 outline-none placeholder-gray-300"
                                            placeholder="Açıklama (Opsiyonel)"
                                            value={item.description || ''}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-1">
                                        <input 
                                            type="text"
                                            className="w-full text-xs text-slate-500 bg-slate-50/50 rounded px-1 py-0.5 border border-transparent focus:border-orange-300 outline-none placeholder-orange-200"
                                            placeholder="Termin Notu (Örn: 2 gün)"
                                            value={item.deliveryNote || ''}
                                            onChange={(e) => updateItem(index, 'deliveryNote', e.target.value)}
                                        />
                                    </div>
                                </div>
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
                            <td className="px-3 py-3 align-top">
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-right focus:ring-1 focus:ring-blue-500 outline-none text-slate-900"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                                    />
                                </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                                <div className="flex items-center gap-1 bg-slate-100 rounded px-2 py-1">
                                    <select 
                                        className="bg-transparent border-none text-xs font-bold text-slate-700 p-0 focus:ring-0 cursor-pointer w-full"
                                        value={item.taxRate}
                                        onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value))}
                                    >
                                        <option value="0">%0</option>
                                        <option value="1">%1</option>
                                        <option value="10">%10</option>
                                        <option value="20">%20</option>
                                    </select>
                                </div>
                            </td>
                            <td className="px-3 py-3 align-top text-right font-medium text-slate-800">
                                {(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€'}
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
            
            <div className="flex justify-end mt-8">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Ara Toplam</span>
                        <span>{items.reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500 border-b border-slate-200 pb-2">
                        <span>Toplam KDV</span>
                        <span>{items.reduce((sum, i) => sum + ((i.total || 0) * ((i.taxRate || 0)/100)), 0).toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-800">
                        <span>GENEL TOPLAM</span>
                        <span>{(items.reduce((sum, i) => sum + (i.total || 0) + ((i.total || 0) * ((i.taxRate || 0)/100)), 0)).toLocaleString()} {currency}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditor;
