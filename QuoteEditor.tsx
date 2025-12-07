
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, User, Calendar, FileText, MapPin, X, Pencil, Truck } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status, Currency, LineItem, Document, Customer, Product } from '../types';

const QuoteEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); 
  const { customers, products, addDocument, updateDocument, addCustomer, addProduct, getDocument, deleteDocument, currentRates } = useSales();

  // Mode Detection
  const isEditMode = !!id;
  const isOrderMode = location.pathname.includes('/order');
  
  // Set default Document Type based on URL
  const [docType, setDocType] = useState<DocType>(isOrderMode ? DocType.ORDER : DocType.QUOTE);

  // Header Fields
  const [title, setTitle] = useState('');
  
  // Customer Fields
  const [customerInput, setCustomerInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetailsText, setCustomerDetailsText] = useState(''); 
  
  // Detailed Customer Form State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [custForm, setCustForm] = useState<Partial<Customer>>({
      isLegalEntity: true,
      name: '',
      address: '',
      city: '',
      district: '',
      postCode: '',
      taxNo: '',
      taxOffice: '',
      phone: ''
  });

  // Date Fields
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentDueDate, setPaymentDueDate] = useState<string>(''); 
  
  // Financials
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  
  // Content
  const [items, setItems] = useState<Partial<LineItem>[]>([]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Initialization Logic
  useEffect(() => {
    if (isEditMode && id) {
      const doc = getDocument(id);
      if (doc) {
        setTitle(doc.title || (doc.type === DocType.ORDER ? 'Sipariş' : ''));
        setDocType(doc.type); 
        
        if (doc.customer) {
            setCustomerInput(doc.customer.name || '');
            setSelectedCustomerId(doc.customer.id);
            setCustForm({ ...doc.customer });
            
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
        setTerms(doc.terms || '');
        setPaymentDueDate(doc.paymentDueDate || '');
      }
    } else {
      setDocType(isOrderMode ? DocType.ORDER : DocType.QUOTE);
      setItems([{ productId: '', sku: '', productName: '', quantity: 1, unit: 'Adet', discount: 0, unitPrice: 0, taxRate: 20, total: 0, deliveryNote: '' }]);
      setPaymentDueDate(new Date().toISOString().split('T')[0]);
      setTitle(isOrderMode ? 'Yeni Sipariş' : '');
    }
  }, [id, isEditMode, getDocument, isOrderMode]);

  // AUTO-UPDATE EXCHANGE RATE FROM TCMB (Context)
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
      setCustForm({ ...customer });
      
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
      setCustForm(prev => ({ ...prev, name: e.target.value }));
  };

  const openCustomerModal = () => {
      setIsCustomerModalOpen(true);
      if (!selectedCustomerId) {
          setCustForm(prev => ({ ...prev, name: customerInput }));
      }
  };

  const saveCustomerModal = () => {
      setCustomerInput(custForm.name || '');
      const details = [
          custForm.address, 
          custForm.district && custForm.city ? `${custForm.district}/${custForm.city}` : '',
          custForm.taxOffice ? `${custForm.taxOffice} V.D.` : '', 
          custForm.taxNo ? `VKN: ${custForm.taxNo}` : ''
      ].filter(Boolean).join('\n');
      setCustomerDetailsText(details);
      setIsCustomerModalOpen(false);
  };

  const setDueDateOffset = (days: number) => {
      const date = new Date(issueDate);
      date.setDate(date.getDate() + days);
      setPaymentDueDate(date.toISOString().split('T')[0]);
  };

  const handleDelete = () => {
      if (!id) return;
      if (window.confirm('Bu belgeyi silmek istediğinize emin misiniz?')) {
          deleteDocument(id);
          navigate(docType === DocType.ORDER ? '/sales/orders' : '/sales/quotes');
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

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rowNum = i + 1;

        if (!item.productName || item.productName.trim() === '') {
            alert(`${rowNum}. satırda "Ürün Adı" boş bırakılamaz.`);
            return;
        }

        if (!item.quantity || item.quantity <= 0) {
             alert(`${rowNum}. satırda miktar 0'dan büyük olmalıdır.`);
             return;
        }

        if (item.unitPrice === undefined || item.unitPrice === null || isNaN(item.unitPrice)) {
             alert(`${rowNum}. satırda fiyat geçerli değil.`);
             return;
        }
    }

    let finalCustomer: Customer;
    if (selectedCustomerId) {
        finalCustomer = {
            ...customers.find(c => c.id === selectedCustomerId)!,
            ...custForm as Customer
        };
    } else {
        finalCustomer = {
            id: `CUST-${Date.now()}`,
            email: '',
            ...custForm as Customer,
            name: customerInput
        };
        addCustomer(finalCustomer); 
    }

    const processedItems: LineItem[] = [];
    for (const item of items) {
        let finalProductId = item.productId;
        
        // Auto-create product if name is new and no ID
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
            sku: item.sku || '', 
            quantity: item.quantity!,
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
      id: isEditMode && id ? id : (docType === DocType.ORDER ? `SIP-${Math.floor(Math.random() * 10000)}` : `TEK-${Math.floor(1000 + Math.random() * 9000)}`),
      title: title,
      type: docType,
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
      terms
    };

    if (isEditMode) {
        updateDocument(newDoc);
        alert('Belge güncellendi.');
    } else {
        addDocument(newDoc);
        alert('Belge kaydedildi.');
    }
    
    // Redirect to Detail View instead of List View
    if (docType === DocType.ORDER) {
        navigate(`/sales/order/${newDoc.id}`);
    } else {
        navigate(`/sales/quote/view/${newDoc.id}`);
    }
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

  const subTotal = items.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalTax = items.reduce((sum, i) => sum + ((i.total || 0) * ((i.taxRate || 0) / 100)), 0);
  const grandTotal = subTotal + totalTax;

  const getPageTitle = () => {
      if (docType === DocType.ORDER) return isEditMode ? 'Sipariş Düzenle' : 'Yeni Sipariş';
      return isEditMode ? 'Teklif Düzenle' : 'Yeni Teklif';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 relative">
      {/* Top Navigation */}
      <div className="flex items-center justify-between sticky top-0 bg-slate-50 py-4 z-10 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            {docType === DocType.ORDER && <Truck className="text-blue-600" />}
            <h2 className="text-2xl font-bold text-slate-800">{getPageTitle()}</h2>
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
            <button onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50">
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
           
           {docType === DocType.QUOTE && (
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teklif İsmi</label>
               <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Örn: Yıllık Bakım Teklifi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
               />
             </div>
           )}

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
              
              <div className="relative group">
                  <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                          <MapPin size={14}/> Müşteri Bilgileri
                      </label>
                      <button 
                         onClick={openCustomerModal}
                         className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                      >
                         <Pencil size={12}/> Düzenle
                      </button>
                  </div>
                  <div 
                     className="w-full border border-gray-300 rounded-lg p-2.5 text-sm h-[88px] bg-white overflow-y-auto whitespace-pre-line text-gray-600"
                  >
                      {customerDetailsText || <span className="text-slate-400 italic">Adres ve vergi bilgileri...</span>}
                  </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Düzenleme Tarihi</label>
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
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vade Tarihi</label>
                   <div className="space-y-2">
                       <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white">
                           <button onClick={() => setDueDateOffset(0)} className="flex-1 py-2 text-xs font-medium hover:bg-slate-50 border-r border-gray-300 text-slate-700">AYNI GÜN</button>
                           <button onClick={() => setDueDateOffset(30)} className="flex-1 py-2 text-xs font-medium hover:bg-slate-50 border-r border-gray-300 text-slate-700">30 GÜN</button>
                           <button onClick={() => setDueDateOffset(60)} className="flex-1 py-2 text-xs font-medium hover:bg-slate-50 text-slate-700">60 GÜN</button>
                       </div>
                       <input 
                         type="date"
                         className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                         value={paymentDueDate}
                         onChange={(e) => setPaymentDueDate(e.target.value)}
                       />
                   </div>
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

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notlar</label>
                   <textarea 
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-sm bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Teklif notları..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Koşullar</label>
                   <textarea 
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-sm bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Teklif geçerlilik koşulları vb."
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                   />
                </div>
           </div>
        </div>

        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-700">Hizmet / Ürün Kalemleri</h3>
            </div>
            
            <table className="w-full text-left text-sm mb-4">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                        <th className="px-3 py-2 rounded-l-lg w-[15%]">Stok Kodu (SKU)</th>
                        <th className="px-3 py-2 w-[25%]">Ürün / Hizmet Adı</th>
                        <th className="px-3 py-2 w-[10%]">Miktar</th>
                        <th className="px-3 py-2 w-[10%]">Birim</th>
                        <th className="px-3 py-2 w-[15%]">Br. Fiyat</th>
                        <th className="px-3 py-2 w-[10%]">KDV</th>
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
                                            className="w-full text-xs text-slate-500 bg-slate-50 rounded px-1 py-0.5 border border-transparent focus:border-orange-300 outline-none placeholder-orange-200"
                                            placeholder="Termin Notu"
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
                                    className="w-full bg-white border-none text-xs text-slate-700 focus:ring-0 cursor-pointer"
                                    value={item.unit}
                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                >
                                    <option value="Adet">Adet</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Metre">Metre</option>
                                    <option value="Kutu">Kutu</option>
                                    <option value="Saat">Saat</option>
                                    <option value="Proje">Proje</option>
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
                                <select 
                                    className="w-full bg-white border-none text-xs text-slate-700 focus:ring-0 cursor-pointer"
                                    value={item.taxRate}
                                    onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value))}
                                >
                                    <option value="0">%0</option>
                                    <option value="1">%1</option>
                                    <option value="10">%10</option>
                                    <option value="20">%20</option>
                                </select>
                            </td>
                            <td className="px-3 py-3 align-top text-right font-medium text-slate-900">
                                {(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€'}
                            </td>
                            <td className="px-3 py-3 align-top text-center">
                                <button 
                                    onClick={() => removeItem(index)}
                                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 size={16} />
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
                        <span>{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500 border-b border-slate-200 pb-2">
                        <span>Toplam KDV</span>
                        <span>{totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900">
                        <span>GENEL TOPLAM</span>
                        <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
      
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Müşteri Detaylarını Düzenle</h3>
                    <button onClick={() => setIsCustomerModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Firma / Kişi Adı</label>
                        <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={custForm.name} onChange={e => setCustForm({...custForm, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adres</label>
                        <textarea className="w-full border border-gray-300 rounded p-2 h-20 bg-white text-gray-900 placeholder-gray-500" value={custForm.address} onChange={e => setCustForm({...custForm, address: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İlçe</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={custForm.district} onChange={e => setCustForm({...custForm, district: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İl</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={custForm.city} onChange={e => setCustForm({...custForm, city: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vergi Dairesi</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={custForm.taxOffice} onChange={e => setCustForm({...custForm, taxOffice: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">VKN / TCKN</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={custForm.taxNo} onChange={e => setCustForm({...custForm, taxNo: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label>
                        <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={custForm.phone} onChange={e => setCustForm({...custForm, phone: e.target.value})} />
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button onClick={saveCustomerModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Kaydet</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuoteEditor;
