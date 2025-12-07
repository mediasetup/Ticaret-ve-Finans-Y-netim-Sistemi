
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, FileCode, Pencil, Trash2, Download, Plus, Save, CreditCard, CheckCircle, AlertTriangle, Send, Loader2, Building2 } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status, Document, Payment, Currency, Check } from '../types';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDocument, updateDocument, deleteDocument, documents, addPayment, addCheck, payments, accounts, einvoiceConfig, companyInfo } = useSales();
  const [doc, setDoc] = useState<Document | undefined>(undefined);
  
  // State for Modals and UI actions
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'CASH' | 'CHECK'>('BANK');
  
  // Common Payment Fields
  const [payAmount, setPayAmount] = useState('');
  const [payDesc, setPayDesc] = useState('Fatura Tahsilatı');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Check Specific Fields
  const [checkNumber, setCheckNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [drawer, setDrawer] = useState('');
  const [checkDueDate, setCheckDueDate] = useState('');

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEInvoice, setIsSendingEInvoice] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getDocument(id);
      if (found && found.type === DocType.INVOICE) {
        setDoc(found);
      } else {
        navigate('/sales/invoices');
      }
    }
  }, [id, getDocument, documents, navigate]);

  const invoicePayments = payments.filter(p => p.docId === doc?.id);
  const totalPaid = invoicePayments.reduce((sum, p) => sum + (p.amount * p.exchangeRate), 0);
  const remainingAmount = doc ? (doc.totalAmount * (doc.exchangeRate || 1)) - totalPaid : 0;

  if (!doc) return <div className="p-8 text-center">Yükleniyor veya fatura bulunamadı...</div>;

  const goBack = () => navigate(-1);

  const handleDelete = () => {
    if (window.confirm("Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
        deleteDocument(doc.id);
        navigate('/sales/invoices');
    }
  };

  const handleEdit = () => {
      if (doc.relatedDocId) {
          const sourceDoc = getDocument(doc.relatedDocId);
          if(sourceDoc?.type === DocType.ORDER) {
              navigate(`/sales/order/edit/${doc.relatedDocId}`);
          } else if (sourceDoc?.type === DocType.QUOTE) {
              navigate(`/sales/quote/${doc.relatedDocId}`);
          }
      } else {
          alert("Bu faturanın kaynağı olan bir sipariş veya teklif bulunamadı. Düzenleme yapılamaz.");
      }
  };

  const handleOpenPaymentModal = () => {
      setPayAmount(remainingAmount.toFixed(2));
      // Default account if exists
      if(paymentMethod !== 'CHECK') {
          setSelectedAccountId(accounts.find(a => a.currency === doc.currency)?.id || '');
      }
      setIsPaymentModalOpen(true);
  };
  
  const handleSavePayment = async () => {
      const amount = parseFloat(payAmount);
      if(!amount || amount <= 0) {
          alert('Lütfen geçerli bir tutar girin.');
          return;
      }

      // Check Specific Validation
      if (paymentMethod === 'CHECK') {
          if (!checkNumber || !bankName || !drawer || !checkDueDate) {
              alert("Lütfen tüm çek bilgilerini doldurunuz.");
              return;
          }
      } else {
          if(!selectedAccountId) {
              alert('Lütfen geçerli bir hesap seçin.');
              return;
          }
      }
      
      let checkId = undefined;

      // 1. Create Check Record if method is CHECK
      if (paymentMethod === 'CHECK') {
          checkId = `CHK-${Date.now()}`;
          const newCheck: Check = {
              id: checkId,
              checkNumber,
              bankName,
              drawer,
              amount,
              currency: doc.currency,
              issueDate: payDate,
              dueDate: checkDueDate,
              status: 'PENDING',
              customerId: doc.customer.id,
              description: `Fatura ${doc.id} için alındı`
          };
          await addCheck(newCheck);
      }

      // 2. Create Payment Record
      const payment: Payment = {
          id: `PAY-${Date.now()}`,
          customerId: doc.customer.id,
          docId: doc.id,
          accountId: paymentMethod === 'CHECK' ? undefined : selectedAccountId,
          checkId: checkId,
          date: payDate,
          amount: amount,
          currency: doc.currency,
          exchangeRate: doc.exchangeRate || 1.0,
          description: paymentMethod === 'CHECK' ? `${payDesc} (Çek: ${checkNumber})` : payDesc,
          type: 'COLLECTION',
          method: paymentMethod
      };
      
      await addPayment(payment);

      // 3. Update Status
      if(remainingAmount - amount <= 0.01) {
          updateDocument({ ...doc, status: Status.PAID });
      } else {
          updateDocument({ ...doc, status: Status.PARTIAL_PAID });
      }
      
      setIsPaymentModalOpen(false);
      // Reset Fields
      setCheckNumber(''); setBankName(''); setDrawer(''); setCheckDueDate('');
  };

  const generateUBLXML = () => { alert("XML oluşturma özelliği yakında eklenecektir."); };
  
  const handleSendToGIB = () => {
      if(!einvoiceConfig) {
          alert("Lütfen e-Dönüşüm ayarlarından entegratör bilgilerinizi yapılandırın.");
          navigate('/einvoice/settings');
          return;
      }
      setIsSendingEInvoice(true);
      setTimeout(() => {
          updateDocument({ ...doc, eInvoiceStatus: 'QUEUED' });
          setIsSendingEInvoice(false);
      }, 2000);
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    const element = document.getElementById('printable-area');
    const opt = {
        margin: 5,
        filename: `Fatura_${doc.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(() => {
            setIsGeneratingPdf(false);
        });
    } else {
        alert("PDF oluşturma kütüphanesi yüklenemedi.");
        setIsGeneratingPdf(false);
    }
  };

  const subTotal = doc.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const vatAmount = doc.items.reduce((sum, i) => sum + ((i.total || 0) * ((i.taxRate || 20) / 100)), 0);
  const grandTotalWithTax = subTotal + vatAmount;
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:pb-0 print:max-w-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ArrowLeft className="text-slate-600" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800">Fatura Detayı</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={16} /> Sil</button>
            <button onClick={handleEdit} className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Pencil size={16} /> Düzenle</button>
            <button onClick={handleSendToGIB} disabled={isSendingEInvoice || doc.eInvoiceStatus === 'SENT'} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-300">
                {isSendingEInvoice ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} GİB'e Gönder
            </button>
            <button onClick={handleOpenPaymentModal} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"><CreditCard size={16} /> Tahsilat Ekle</button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900">
              {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF İndir
            </button>
        </div>
      </div>

      <div id="printable-area" className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:shadow-none print:border-none print:p-0">
          {/* Invoice Header (same as before) */}
          <header className="flex justify-between items-start pb-6 mb-8 border-b border-slate-200">
               <div className="flex items-start gap-4">
                 <div className="h-16 w-24 flex items-center justify-center">
                     {companyInfo?.logoUrl ? <img src={companyInfo.logoUrl} alt="logo" className="max-w-full max-h-full object-contain" /> : <div className="w-16 h-16 bg-transparent"></div>}
                 </div>
                 <div>
                     <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">{companyInfo?.name}</h1>
                     <div className="text-xs text-slate-500 space-y-0.5 mt-2 leading-snug">
                         <p>{companyInfo?.address}</p>
                         <p>Tel: {companyInfo?.phone} | E-posta: {companyInfo?.email}</p>
                         <p>Mersis: {companyInfo?.mersisNo} | V.D.: {companyInfo?.taxOffice} | VKN: {companyInfo?.taxNo}</p>
                     </div>
                 </div>
               </div>
               <div className="text-right shrink-0">
                   <h2 className="text-3xl font-bold text-slate-200 uppercase tracking-widest print:text-slate-300">FATURA</h2>
                   <p className="text-xl font-bold text-slate-800 mt-1">#{doc.id}</p>
                   <p className="text-slate-500">{doc.date}</p>
               </div>
          </header>
          
          <section className="grid grid-cols-2 gap-12 mb-8">
              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Sayın</h3>
                  <div className="text-slate-800">
                      <p className="font-bold text-lg">{doc.customer.name}</p>
                      <p className="text-slate-600 whitespace-pre-line">{doc.customer.address}</p>
                      <p className="text-slate-600">{doc.customer.district && `${doc.customer.district}/`}{doc.customer.city}</p>
                      {(doc.customer.taxNo) && (
                          <div className="mt-2 text-xs text-slate-500">
                              {doc.customer.taxOffice && <span>{doc.customer.taxOffice} V.D. | </span>}
                              <span>VKN: {doc.customer.taxNo}</span>
                          </div>
                      )}
                  </div>
              </div>
              <div className="text-right">
                  <div className="bg-slate-50 rounded-lg p-4 print:bg-transparent print:p-0 w-fit ml-auto">
                      <div className="mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase block">Vade Tarihi</span>
                          <span className="font-medium">{doc.paymentDueDate || '-'}</span>
                      </div>
                  </div>
              </div>
          </section>

          <table className="w-full text-left text-sm mb-8 border-collapse">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                <tr>
                    <th className="py-3 px-4 font-bold rounded-tl-lg">SKU</th>
                    <th className="py-3 px-4 font-bold">Açıklama</th>
                    <th className="py-3 px-4 font-bold text-center">Miktar</th>
                    <th className="py-3 px-4 font-bold text-right">Birim Fiyat</th>
                    <th className="py-3 px-4 font-bold text-center">KDV</th>
                    <th className="py-3 px-4 font-bold text-right rounded-tr-lg">Toplam</th>
                </tr>
            </thead>
            <tbody className="text-slate-700">
                {doc.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-none">
                       <td className="py-3 px-4 text-slate-500 font-mono text-xs">{item.sku}</td>
                       <td className="py-3 px-4 font-bold text-slate-800">{item.productName}</td>
                       <td className="py-3 px-4 text-center font-medium">{item.quantity} {item.unit}</td>
                       <td className="py-3 px-4 text-right">{item.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                       <td className="py-3 px-4 text-center text-xs">%{item.taxRate}</td>
                       <td className="py-3 px-4 text-right font-bold text-slate-900">{item.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                ))}
            </tbody>
          </table>
          
          <div className="flex justify-between items-start border-t border-slate-200 pt-6">
               <div className="text-xs text-slate-500 max-w-md">
                   <strong>Notlar:</strong> {doc.notes || 'Yok.'}
               </div>
               <div className="w-80 space-y-2 text-right">
                  <div className="flex justify-between text-sm text-slate-600"><span>Ara Toplam</span><span>{subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                  <div className="flex justify-between text-sm text-slate-600"><span>Hesaplanan KDV</span><span>{vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                  <div className="flex justify-between text-xl font-bold text-slate-900 bg-slate-100 p-2 rounded-lg mt-2"><span>ÖDENECEK TUTAR</span><span>{grandTotalWithTax.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
          {/* Payment History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4">Ödeme Geçmişi</h3>
              {invoicePayments.length > 0 ? (
                  <div className="space-y-3">
                      {invoicePayments.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <div>
                                  <p className="font-medium text-emerald-700 flex items-center gap-2">
                                    {p.method === 'CHECK' ? 'Çek ile Tahsilat' : 'Tahsilat'}
                                  </p>
                                  <p className="text-xs text-slate-500">{p.date} - {p.description}</p>
                              </div>
                              <p className="font-bold text-emerald-700">{p.amount.toLocaleString(undefined, {minimumFractionDigits: 2})} {p.currency}</p>
                          </div>
                      ))}
                      <div className="pt-3 border-t border-slate-200 mt-3 text-right">
                          <p className="text-xs text-slate-500">Ödenen Tutar</p>
                          <p className="font-bold text-slate-800">{totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</p>
                          <p className="text-xs text-slate-500 mt-2">Kalan Tutar</p>
                          <p className="font-bold text-lg text-red-600">{remainingAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</p>
                      </div>
                  </div>
              ) : (
                  <p className="text-sm text-slate-400 text-center py-4">Bu fatura için henüz ödeme kaydı yok.</p>
              )}
          </div>
          
          {/* Status Box (GIB) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
               <h3 className="font-bold text-slate-800 mb-4">e-Fatura Durumu</h3>
               {/* ... (Status content same as before) */}
               <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                  {doc.eInvoiceStatus === 'SENT' && <CheckCircle className="text-emerald-500" size={24} />}
                  {doc.eInvoiceStatus === 'ERROR' && <AlertTriangle className="text-red-500" size={24} />}
                  {doc.eInvoiceStatus === 'QUEUED' && <Loader2 className="text-amber-500 animate-spin" size={24} />}
                  {!doc.eInvoiceStatus && <Send className="text-slate-400" size={24} />}
                  <div>
                      <p className="font-bold text-slate-800">
                          {doc.eInvoiceStatus === 'SENT' ? 'GİB\'e İletildi' :
                           doc.eInvoiceStatus === 'ERROR' ? 'Gönderim Hatası' :
                           doc.eInvoiceStatus === 'QUEUED' ? 'Sırada Bekliyor' : 'Gönderilmedi'}
                      </p>
                      <p className="text-xs text-slate-500">
                          {doc.eInvoiceStatus === 'SENT' ? 'Fatura başarıyla entegratöre iletildi.' :
                           doc.eInvoiceStatus === 'ERROR' ? 'Entegratörden hata mesajı alındı.' :
                           doc.eInvoiceStatus === 'QUEUED' ? 'Faturanız gönderim için sırada.' : 'Fatura henüz GİB\'e gönderilmedi.'}
                      </p>
                  </div>
              </div>
          </div>
      </div>
      
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Tahsilat Ekle</h3>
                    <button onClick={() => setIsPaymentModalOpen(false)}>X</button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Payment Method Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${paymentMethod === 'BANK' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} 
                            onClick={() => setPaymentMethod('BANK')}
                        >
                            HAVALE / EFT
                        </button>
                        <button 
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${paymentMethod === 'CHECK' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} 
                            onClick={() => setPaymentMethod('CHECK')}
                        >
                            ÇEK
                        </button>
                        <button 
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${paymentMethod === 'CASH' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} 
                            onClick={() => setPaymentMethod('CASH')}
                        >
                            NAKİT
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tutar ({doc.currency})</label>
                        <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-lg font-bold bg-white text-gray-900" />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tahsilat Tarihi</label>
                        <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" />
                    </div>

                    {/* Conditional Fields based on Method */}
                    {paymentMethod === 'CHECK' ? (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Çek Numarası</label>
                                <input type="text" value={checkNumber} onChange={e => setCheckNumber(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" placeholder="Çek No" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Banka Adı</label>
                                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" placeholder="Örn: Garanti BBVA" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keşideci (Çek Sahibi)</label>
                                <input type="text" value={drawer} onChange={e => setDrawer(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" placeholder="Firma veya Şahıs Adı" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vade Tarihi</label>
                                <input type="date" value={checkDueDate} onChange={e => setCheckDueDate(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" />
                             </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hesap (Kasa/Banka)</label>
                            <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900">
                                <option value="">Seçiniz</option>
                                {accounts.filter(a => a.currency === doc.currency).map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                        <input type="text" value={payDesc} onChange={e => setPayDesc(e.target.value)} className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-lg hover:bg-slate-200">Vazgeç</button>
                    <button onClick={handleSavePayment} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                        <Save size={16} className="inline-block mr-2" />
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
