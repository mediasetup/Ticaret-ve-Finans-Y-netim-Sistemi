
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Plus, MapPin, Phone, Mail, Building2, CreditCard, Calendar, Hexagon, X, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status, Payment, Currency, Customer, Check } from '../types';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, documents, payments, addPayment, updatePayment, deletePayment, accounts, updateCustomer, addCheck } = useSales();
  
  // Modals State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  // Payment Form State
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'CASH' | 'CHECK'>('BANK');
  const [payAmount, setPayAmount] = useState('');
  const [payDesc, setPayDesc] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payCurrency, setPayCurrency] = useState<Currency>('TRY');
  const [payExchangeRate, setPayExchangeRate] = useState<number>(1.0);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Check Specific Fields
  const [checkNumber, setCheckNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [drawer, setDrawer] = useState('');
  const [checkDueDate, setCheckDueDate] = useState('');

  // Customer Edit Form State
  const [custForm, setCustForm] = useState<Partial<Customer>>({});

  const customer = customers.find(c => c.id === id);

  const availableAccounts = accounts.filter(acc => acc.currency === payCurrency);

  useEffect(() => {
     if (availableAccounts.length > 0 && !selectedAccountId && paymentMethod !== 'CHECK') {
         setSelectedAccountId(availableAccounts[0].id);
     }
  }, [payCurrency, accounts, paymentMethod]);

  useEffect(() => {
     if (!editingPaymentId) {
        if (payCurrency === 'TRY') setPayExchangeRate(1.0);
        if (payCurrency === 'USD') setPayExchangeRate(32.50);
        if (payCurrency === 'EUR') setPayExchangeRate(35.20);
     }
  }, [payCurrency, editingPaymentId]);

  const ledger = useMemo(() => {
    if (!customer) return [];

    const txs: Array<{
      id: string;
      date: string;
      type: 'INVOICE' | 'COLLECTION';
      description: string;
      debit: number;
      credit: number;
      currency: string;
      baseEffect: number;
      balance: number;
      docId?: string;
    }> = [];

    documents
      .filter(d => d.customer.id === customer.id && d.type === DocType.INVOICE)
      .forEach(inv => {
        const rate = inv.exchangeRate || 1.0;
        txs.push({
          id: inv.id,
          date: inv.date,
          type: 'INVOICE',
          description: `Satış Faturası - ${inv.id}`,
          debit: inv.totalAmount,
          credit: 0,
          currency: inv.currency,
          baseEffect: inv.totalAmount * rate,
          balance: 0, 
          docId: inv.id,
        });
      });

    payments
      .filter(p => p.customerId === customer.id)
      .forEach(pay => {
        const rate = pay.exchangeRate || 1.0;
        txs.push({
          id: pay.id,
          date: pay.date,
          type: 'COLLECTION',
          description: pay.description || 'Tahsilat',
          debit: 0,
          credit: pay.amount,
          currency: pay.currency,
          baseEffect: -(pay.amount * rate),
          balance: 0,
          docId: pay.docId,
        });
      });

    txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    txs.forEach(tx => {
      runningBalance += tx.baseEffect;
      tx.balance = runningBalance;
    });

    return txs;
  }, [customer, documents, payments]);

  const summary = useMemo(() => {
    const balance = ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;
    return { balance };
  }, [ledger]);

  if (!customer) return <div className="p-8">Müşteri bulunamadı.</div>;

  const handleOpenPaymentModal = (payId?: string) => {
      if (payId) {
          const pay = payments.find(p => p.id === payId);
          if (pay) {
              setEditingPaymentId(payId);
              setPaymentMethod(pay.method as any);
              setPayAmount(pay.amount.toString());
              setPayDesc(pay.description || '');
              setPayDate(pay.date);
              setPayCurrency(pay.currency);
              setPayExchangeRate(pay.exchangeRate);
              setSelectedAccountId(pay.accountId || '');
              // Note: Editing check details is tricky if linked. For simplicity, we disable switching to check or editing check details on existing payments here.
              setIsPaymentModalOpen(true);
          }
      } else {
          setEditingPaymentId(null);
          setPaymentMethod('BANK');
          setPayAmount('');
          setPayDesc('');
          setPayDate(new Date().toISOString().split('T')[0]);
          setPayCurrency('TRY');
          // Reset check fields
          setCheckNumber(''); setBankName(''); setDrawer(''); setCheckDueDate('');
          setIsPaymentModalOpen(true);
      }
  };

  const handleOpenCustomerEdit = () => {
      setCustForm({ ...customer });
      setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = () => {
      if (!custForm.name) return alert("İsim zorunludur.");
      
      updateCustomer(customer.id, custForm);
      setIsCustomerModalOpen(false);
      alert("Müşteri bilgileri güncellendi.");
  };

  const handleSavePayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
        alert("Geçerli bir tutar giriniz.");
        return;
    }
    
    if (paymentMethod === 'CHECK') {
        if (!checkNumber || !bankName || !drawer || !checkDueDate) {
            alert("Lütfen tüm çek bilgilerini doldurunuz.");
            return;
        }
    } else {
        if (!selectedAccountId) {
            alert("Lütfen tahsilatın yapılacağı kasa/banka hesabını seçiniz.");
            return;
        }
    }

    let checkId = undefined;

    // 1. Create Check if method is CHECK and not editing
    if (paymentMethod === 'CHECK' && !editingPaymentId) {
        checkId = `CHK-${Date.now()}`;
        const newCheck: Check = {
            id: checkId,
            checkNumber,
            bankName,
            drawer,
            amount: parseFloat(payAmount),
            currency: payCurrency,
            issueDate: payDate,
            dueDate: checkDueDate,
            status: 'PENDING',
            customerId: customer.id,
            description: `Cari Tahsilat`
        };
        await addCheck(newCheck);
    }

    const paymentData: Payment = {
        id: editingPaymentId || `PAY-${Date.now()}`,
        customerId: customer.id,
        accountId: paymentMethod === 'CHECK' ? undefined : selectedAccountId,
        checkId: checkId,
        date: payDate,
        amount: parseFloat(payAmount),
        currency: payCurrency,
        exchangeRate: payExchangeRate,
        description: paymentMethod === 'CHECK' ? `${payDesc} (Çek: ${checkNumber})` : (payDesc || 'Cari Hesaba Mahsuben'),
        type: 'COLLECTION',
        method: paymentMethod
    };

    if (editingPaymentId) {
        const oldPay = payments.find(p => p.id === editingPaymentId);
        if (oldPay) {
            paymentData.docId = oldPay.docId;
            paymentData.processingRate = oldPay.processingRate;
            updatePayment(paymentData);
            alert("Tahsilat güncellendi.");
        }
    } else {
        addPayment(paymentData);
        alert("Tahsilat eklendi.");
    }
    
    setIsPaymentModalOpen(false);
  };

  const handleDeletePayment = (payId: string) => {
      if (window.confirm("Bu tahsilat kaydını silmek istediğinize emin misiniz?")) {
          deletePayment(payId);
      }
  };

  const handleDownloadStatement = () => {
      const element = document.getElementById('printable-statement');
      const opt = {
          margin: 10,
          filename: `Cari_Ekstre_${customer.name}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      if (typeof html2pdf !== 'undefined') {
          html2pdf().set(opt).from(element).save();
      } else {
          alert('PDF oluşturulamadı.');
      }
  };

  const navigateToInvoice = (docId?: string) => {
      if (docId) {
          navigate(`/sales/invoice/${docId}`);
      }
  };

  const goBack = () => navigate(-1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{customer.name}</h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
               {customer.city && <span>{customer.city}</span>}
               <span>•</span>
               <span>{customer.taxNo ? `VKN: ${customer.taxNo}` : 'Bireysel'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleDownloadStatement}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 font-medium"
            >
                <Download size={18} /> Ekstre İndir
            </button>
            <button 
                onClick={() => handleOpenPaymentModal()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm"
            >
                <Plus size={18} /> Tahsilat Ekle
            </button>
            <button
               onClick={handleOpenCustomerEdit}
               className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
            >
                <Pencil size={18} /> Düzenle
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Info & Summary */}
          <div className="space-y-6">
              {/* Customer Info Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">İletişim Bilgileri</h3>
                  <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                          <span className="text-slate-600">{customer.address || '-'} <br/> {customer.district}/{customer.city}</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{customer.phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{customer.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{customer.taxOffice} V.D. - {customer.taxNo}</span>
                      </div>
                  </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Finansal Özet</h3>
                  <div className="space-y-4">
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-base font-bold text-slate-700">Güncel Bakiye (TL Karşılığı)</span>
                          <span className={`text-xl font-bold ${summary.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              ₺{summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                      </div>
                      <p className="text-xs text-slate-400">
                          * Bakiye, tüm döviz işlemlerinin TCMB kuru üzerinden TL karşılığı hesaplanarak gösterilmektedir.
                      </p>
                  </div>
              </div>
          </div>

          {/* Right Column: Ledger Table */}
          <div className="lg:col-span-2">
              <div id="printable-statement" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 print:p-0 print:border-none print:shadow-none">
                  
                  {/* Statement Header */}
                  <div className="hidden print:block mb-6 border-b border-slate-200 pb-4">
                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                             <Hexagon size={32} className="text-red-600" />
                             <div>
                                 <h1 className="text-xl font-bold uppercase">LİTROS MAKİNA</h1>
                                 <p className="text-xs text-slate-500">Cari Hesap Ekstresi</p>
                             </div>
                          </div>
                          <div className="text-right">
                              <h2 className="font-bold text-lg">{customer.name}</h2>
                              <p className="text-sm text-slate-500">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-between items-center mb-4 print:hidden">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <CreditCard className="text-blue-600" size={20}/>
                          Cari Hareketler (Ekstre)
                      </h3>
                  </div>

                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                          <tr>
                              <th className="px-4 py-3">Tarih</th>
                              <th className="px-4 py-3">İşlem / Açıklama</th>
                              <th className="px-4 py-3 text-right text-red-600">Borç</th>
                              <th className="px-4 py-3 text-right text-emerald-600">Alacak</th>
                              <th className="px-4 py-3 text-right">Bakiye (TL)</th>
                              <th className="px-4 py-3 text-center print:hidden w-20">İşlem</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {ledger.length === 0 ? (
                              <tr>
                                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                      Henüz işlem kaydı bulunmamaktadır.
                                  </td>
                              </tr>
                          ) : (
                              ledger.map((tx, idx) => (
                                  <tr 
                                     key={idx} 
                                     className="hover:bg-slate-50 group"
                                  >
                                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{tx.date}</td>
                                      <td className="px-4 py-3 cursor-pointer" onClick={() => tx.type === 'INVOICE' && navigateToInvoice(tx.docId)}>
                                          <div className="font-medium text-slate-800 flex items-center gap-2">
                                              {tx.type === 'INVOICE' ? 'Satış Faturası' : 'Tahsilat'}
                                              {tx.type === 'INVOICE' && <ExternalLink size={12} className="text-slate-400"/>}
                                          </div>
                                          <div className="text-xs text-slate-500">{tx.description}</div>
                                      </td>
                                      <td className="px-4 py-3 text-right font-medium text-red-600">
                                          {tx.debit > 0 ? `${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${tx.currency}` : '-'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-medium text-emerald-600">
                                          {tx.credit > 0 ? `${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${tx.currency}` : '-'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                                          ₺{tx.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-center print:hidden">
                                          {tx.type === 'COLLECTION' && (
                                              <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(tx.id); }}
                                                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                                    title="Düzenle"
                                                  >
                                                      <Pencil size={14} />
                                                  </button>
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeletePayment(tx.id); }}
                                                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                                                    title="Sil"
                                                  >
                                                      <Trash2 size={14} />
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
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">
                          {editingPaymentId ? 'Tahsilatı Düzenle' : 'Tahsilat Ekle (Cariye Mahsuben)'}
                      </h3>
                      <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      {/* Payment Method Tabs */}
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button 
                              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${paymentMethod === 'BANK' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} 
                              onClick={() => !editingPaymentId && setPaymentMethod('BANK')}
                              disabled={!!editingPaymentId}
                          >
                              HAVALE / EFT
                          </button>
                          <button 
                              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${paymentMethod === 'CHECK' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} 
                              onClick={() => !editingPaymentId && setPaymentMethod('CHECK')}
                              disabled={!!editingPaymentId}
                          >
                              ÇEK
                          </button>
                          <button 
                              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${paymentMethod === 'CASH' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} 
                              onClick={() => !editingPaymentId && setPaymentMethod('CASH')}
                              disabled={!!editingPaymentId}
                          >
                              NAKİT
                          </button>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarih</label>
                          <input type="date" className="w-full border rounded p-2" value={payDate} onChange={e => setPayDate(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Döviz</label>
                             <select className="w-full border rounded p-2 bg-white" value={payCurrency} onChange={(e) => setPayCurrency(e.target.value as Currency)}>
                                 <option value="TRY">TRY (₺)</option>
                                 <option value="USD">USD ($)</option>
                                 <option value="EUR">EUR (€)</option>
                             </select>
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kur</label>
                             <input type="number" step="0.0001" className="w-full border rounded p-2 bg-slate-50" value={payExchangeRate} onChange={e => setPayExchangeRate(parseFloat(e.target.value))} readOnly={payCurrency === 'TRY'} />
                          </div>
                      </div>
                      
                      {paymentMethod === 'CHECK' ? (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                             {editingPaymentId ? (
                                 <p className="text-sm text-slate-500 italic">Çek detayları sadece Çek modülünden düzenlenebilir.</p>
                             ) : (
                                 <>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Çek Numarası</label>
                                        <input type="text" value={checkNumber} onChange={e => setCheckNumber(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" placeholder="Çek No" />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Banka Adı</label>
                                        <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" placeholder="Örn: Garanti BBVA" />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keşideci</label>
                                        <input type="text" value={drawer} onChange={e => setDrawer(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" placeholder="Firma veya Şahıs Adı" />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vade Tarihi</label>
                                        <input type="date" value={checkDueDate} onChange={e => setCheckDueDate(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" />
                                     </div>
                                 </>
                             )}
                        </div>
                      ) : (
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kasa / Banka Hesabı</label>
                              <select 
                                className="w-full border rounded p-2 bg-white" 
                                value={selectedAccountId} 
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                              >
                                    {availableAccounts.length === 0 && <option value="">Bu dövizde hesap yok</option>}
                                    {availableAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} {acc.currency})</option>
                                    ))}
                              </select>
                          </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tutar</label>
                          <input type="number" className="w-full border rounded p-2 text-lg font-bold" placeholder="0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                          <p className="text-xs text-slate-400 mt-1">Seçili döviz cinsinden giriniz.</p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                          <input type="text" className="w-full border rounded p-2" placeholder="Örn: Banka Havalesi" value={payDesc} onChange={e => setPayDesc(e.target.value)} />
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">İptal</button>
                      <button onClick={handleSavePayment} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 shadow-sm">
                          {editingPaymentId ? 'Güncelle' : 'Kaydet'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Customer Edit Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Müşteri Kartını Düzenle</h3>
                    <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Customer Type Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                        <button 
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${custForm.isLegalEntity ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setCustForm({...custForm, isLegalEntity: true})}
                        >
                            Kurumsal (Firma)
                        </button>
                        <button 
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!custForm.isLegalEntity ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setCustForm({...custForm, isLegalEntity: false})}
                        >
                            Bireysel (Şahıs)
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            {custForm.isLegalEntity ? 'Firma Ünvanı *' : 'Ad Soyad *'}
                        </label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={custForm.name || ''} onChange={e => setCustForm({...custForm, name: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-Posta</label>
                            <input type="email" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-900" value={custForm.email || ''} onChange={e => setCustForm({...custForm, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label>
                            <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-900" value={custForm.phone || ''} onChange={e => setCustForm({...custForm, phone: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adres</label>
                        <textarea className="w-full border border-slate-300 rounded-lg p-2.5 outline-none h-20 resize-none bg-white text-slate-900" value={custForm.address || ''} onChange={e => setCustForm({...custForm, address: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İlçe</label>
                            <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-900" value={custForm.district || ''} onChange={e => setCustForm({...custForm, district: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İl</label>
                            <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-900" value={custForm.city || ''} onChange={e => setCustForm({...custForm, city: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {custForm.isLegalEntity && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vergi Dairesi</label>
                                <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-900" value={custForm.taxOffice || ''} onChange={e => setCustForm({...custForm, taxOffice: e.target.value})} />
                            </div>
                        )}
                         <div className={!custForm.isLegalEntity ? 'col-span-2' : ''}>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                {custForm.isLegalEntity ? 'Vergi No (VKN)' : 'TC Kimlik No (TCKN)'}
                            </label>
                            <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-900" value={custForm.taxNo || ''} onChange={e => setCustForm({...custForm, taxNo: e.target.value})} />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Vazgeç</button>
                    <button onClick={handleSaveCustomer} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm">Kaydet</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
