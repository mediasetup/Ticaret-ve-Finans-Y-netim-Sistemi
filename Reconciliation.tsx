import React, { useState, useMemo } from 'react';
import { useSales } from '../context/SalesContext';
import { DocType, Reconciliation, Customer } from '../types';
import { Search, Calendar, FileCheck2, Download, Printer, Check, X, Hexagon, Filter, Pencil, Trash2 } from 'lucide-react';

declare var html2pdf: any;

const ReconciliationPage = () => {
  const { customers, documents, payments, addReconciliation, updateReconciliation, deleteReconciliation, reconciliations } = useSales();

  // Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]); // Jan 1
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today

  // Reconciliation Action State
  const [reconStatus, setReconStatus] = useState<'AGREED' | 'NOT_AGREED'>('AGREED');
  const [reconNote, setReconNote] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecon, setEditingRecon] = useState<Reconciliation | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Filter customers for dropdown
  const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.taxNo?.includes(searchTerm)
  );

  // DATA ENGINE
  const statementData = useMemo(() => {
      if (!selectedCustomer) return { transactions: [], initialBalance: 0, finalBalance: 0 };

      // 1. Calculate Initial Balance (Transactions BEFORE startDate)
      let initialBalance = 0;

      // Invoices before start date (Debt)
      documents
        .filter(d => d.customer.id === selectedCustomer.id && d.type === DocType.INVOICE && d.date < startDate)
        .forEach(inv => {
            const rate = inv.exchangeRate || 1.0;
            initialBalance += inv.totalAmount * rate;
        });

      // Payments before start date (Credit)
      payments
        .filter(p => p.customerId === selectedCustomer.id && p.date < startDate)
        .forEach(pay => {
            const rate = pay.exchangeRate || 1.0;
            initialBalance -= pay.amount * rate;
        });

      // 2. Calculate Transactions in Range
      const txs: Array<{
          date: string;
          type: string;
          docNo: string;
          desc: string;
          debt: number; // Borç
          credit: number; // Alacak
          balance: number;
          currency: string;
          origAmount: number;
      }> = [];

      // Invoices in range
      documents
        .filter(d => d.customer.id === selectedCustomer.id && d.type === DocType.INVOICE && d.date >= startDate && d.date <= endDate)
        .forEach(inv => {
            const rate = inv.exchangeRate || 1.0;
            const amountTL = inv.totalAmount * rate;
            txs.push({
                date: inv.date,
                type: 'Fatura',
                docNo: inv.id,
                desc: 'Satış Faturası',
                debt: amountTL,
                credit: 0,
                balance: 0,
                currency: inv.currency,
                origAmount: inv.totalAmount
            });
        });

      // Payments in range
      payments
        .filter(p => p.customerId === selectedCustomer.id && p.date >= startDate && p.date <= endDate)
        .forEach(pay => {
            const rate = pay.exchangeRate || 1.0;
            const amountTL = pay.amount * rate;
            txs.push({
                date: pay.date,
                type: 'Tahsilat',
                docNo: pay.id,
                desc: pay.description || 'Ödeme',
                debt: 0,
                credit: amountTL,
                balance: 0,
                currency: pay.currency,
                origAmount: pay.amount
            });
        });

      // Sort
      txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Compute Running Balance
      let runningBalance = initialBalance;
      txs.forEach(tx => {
          runningBalance += (tx.debt - tx.credit);
          tx.balance = runningBalance;
      });

      return {
          initialBalance,
          transactions: txs,
          finalBalance: runningBalance
      };

  }, [selectedCustomer, startDate, endDate, documents, payments]);

  // Previous reconciliations for this customer
  const history = reconciliations
      .filter(r => r.customerId === selectedCustomerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSaveReconciliation = () => {
      if (!selectedCustomerId) return;

      const newRec: Reconciliation = {
          id: `REC-${Date.now()}`,
          customerId: selectedCustomerId,
          date: new Date().toISOString().split('T')[0],
          periodStart: startDate,
          periodEnd: endDate,
          balance: statementData.finalBalance,
          status: reconStatus,
          note: reconNote,
          createdAt: new Date().toISOString()
      };

      addReconciliation(newRec);
      setReconNote('');
      alert('Mutabakat kaydı başarıyla oluşturuldu.');
  };

  const handlePrint = () => {
      setIsGeneratingPdf(true);
      const element = document.getElementById('printable-area');
      const filename = `Mutabakat_${selectedCustomer?.name}_${endDate}.pdf`;
      const opt = {
          margin: [10, 10, 15, 10], 
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
      };

      if (typeof html2pdf !== 'undefined') {
          html2pdf().set(opt).from(element).save().then(() => setIsGeneratingPdf(false));
      } else {
          alert('PDF hatası.');
          setIsGeneratingPdf(false);
      }
  };

  const handleDeleteReconciliation = (id: string) => {
      if (window.confirm("Bu mutabakat kaydını silmek istediğinize emin misiniz?")) {
          deleteReconciliation(id);
      }
  };

  const handleEditReconciliation = (rec: Reconciliation) => {
      setEditingRecon(rec);
      setIsEditModalOpen(true);
  };

  const handleUpdateReconciliation = () => {
      if (editingRecon) {
          updateReconciliation(editingRecon);
          setIsEditModalOpen(false);
          setEditingRecon(null);
      }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
        {/* Header & Filters */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
            <div className="w-full xl:w-1/3">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cari Hesap Seçimi</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select 
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-slate-900 font-medium"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                        <option value="">Cari Seçiniz...</option>
                        {filteredCustomers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Başlangıç Tarihi</label>
                    <input 
                        type="date" 
                        className="w-full py-2 px-3 border border-slate-300 rounded-lg outline-none bg-white text-slate-900"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bitiş Tarihi</label>
                    <input 
                        type="date" 
                        className="w-full py-2 px-3 border border-slate-300 rounded-lg outline-none bg-white text-slate-900"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={handlePrint}
                        disabled={!selectedCustomer}
                        className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPdf ? 'Hazırlanıyor...' : <><Printer size={18} /> Yazdır / PDF</>}
                    </button>
                </div>
            </div>
        </div>

        {selectedCustomer ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Statement Area */}
                <div className="lg:col-span-2">
                    <div id="printable-area" className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 print:shadow-none print:border-none print:p-0">
                        {/* Letterhead */}
                        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                             <div className="flex items-start gap-4">
                                 <div className="bg-blue-600 text-white p-3 rounded-lg print:border print:border-blue-600 h-16 w-16 flex items-center justify-center">
                                     <Hexagon size={36} strokeWidth={2.5} />
                                 </div>
                                 <div>
                                     <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">LİTROS MAKİNA</h1>
                                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sanayi ve Ticaret A.Ş.</p>
                                     <p className="text-[10px] text-slate-500">
                                         İkitelli OSB. 12. Blok No:123 Başakşehir / İSTANBUL<br/>
                                         Tel: +90 212 123 45 67 | VKN: 1234567890
                                     </p>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <h2 className="text-2xl font-bold text-slate-700 uppercase tracking-widest">MUTABAKAT MEKTUBU</h2>
                                 <p className="text-sm text-slate-500 mt-1">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                             </div>
                        </div>

                        {/* Customer Info Block */}
                        <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100 print:bg-transparent print:border-none print:p-0">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">{selectedCustomer.name}</h3>
                            <p className="text-sm text-slate-600 mb-2">{selectedCustomer.address}</p>
                            <div className="flex gap-4 text-xs text-slate-500">
                                <span>{selectedCustomer.taxOffice ? `${selectedCustomer.taxOffice} V.D.` : ''}</span>
                                <span>{selectedCustomer.taxNo ? `VKN: ${selectedCustomer.taxNo}` : ''}</span>
                            </div>
                        </div>

                        {/* Statement Text */}
                        <div className="mb-6 text-sm text-slate-700 leading-relaxed">
                            <p>
                                Sayın İlgili, <br/><br/>
                                Şirketimiz nezdindeki cari hesabınızın <strong>{new Date(startDate).toLocaleDateString('tr-TR')}</strong> - <strong>{new Date(endDate).toLocaleDateString('tr-TR')}</strong> tarihleri arasındaki hareket dökümü aşağıdadır.
                                <br/>
                                <strong>{new Date(endDate).toLocaleDateString('tr-TR')}</strong> tarihi itibarıyla bakiyeniz <strong>{statementData.finalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL {statementData.finalBalance > 0 ? '(BORÇ)' : statementData.finalBalance < 0 ? '(ALACAK)' : ''}</strong> olarak görünmektedir.
                                <br/><br/>
                                Mutabık olup olmadığınızı bildirmenizi rica ederiz.
                            </p>
                        </div>

                        {/* Table */}
                        <table className="w-full text-left text-xs mb-6">
                            <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2">Tarih</th>
                                    <th className="px-3 py-2">Belge No</th>
                                    <th className="px-3 py-2">Açıklama</th>
                                    <th className="px-3 py-2 text-right">Borç</th>
                                    <th className="px-3 py-2 text-right">Alacak</th>
                                    <th className="px-3 py-2 text-right">Bakiye</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {/* Initial Balance Row */}
                                <tr className="bg-slate-50 font-medium">
                                    <td className="px-3 py-2">{new Date(startDate).toLocaleDateString('tr-TR')}</td>
                                    <td className="px-3 py-2">-</td>
                                    <td className="px-3 py-2">DEVİR BAKİYESİ</td>
                                    <td className="px-3 py-2 text-right">{statementData.initialBalance > 0 ? statementData.initialBalance.toLocaleString('tr-TR', {minimumFractionDigits: 2}) : '-'}</td>
                                    <td className="px-3 py-2 text-right">{statementData.initialBalance < 0 ? Math.abs(statementData.initialBalance).toLocaleString('tr-TR', {minimumFractionDigits: 2}) : '-'}</td>
                                    <td className="px-3 py-2 text-right">{statementData.initialBalance.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                                </tr>
                                {/* Transactions */}
                                {statementData.transactions.map((tx, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-2">{tx.date}</td>
                                        <td className="px-3 py-2 font-mono">{tx.docNo}</td>
                                        <td className="px-3 py-2">
                                            {tx.desc} 
                                            {tx.currency !== 'TRY' && <span className="text-slate-400 ml-1">({tx.origAmount.toLocaleString()} {tx.currency})</span>}
                                        </td>
                                        <td className="px-3 py-2 text-right">{tx.debt > 0 ? tx.debt.toLocaleString('tr-TR', {minimumFractionDigits: 2}) : '-'}</td>
                                        <td className="px-3 py-2 text-right">{tx.credit > 0 ? tx.credit.toLocaleString('tr-TR', {minimumFractionDigits: 2}) : '-'}</td>
                                        <td className="px-3 py-2 text-right font-medium">{tx.balance.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-50">
                                <tr>
                                    <td colSpan={3} className="px-3 py-3 text-right">TOPLAM BAKİYE (TL):</td>
                                    <td colSpan={3} className="px-3 py-3 text-right text-base">
                                        {statementData.finalBalance.toLocaleString('tr-TR', {minimumFractionDigits: 2})} TL
                                        <span className="ml-2 text-xs font-normal text-slate-500">
                                            {statementData.finalBalance > 0 ? '(BORÇLU)' : statementData.finalBalance < 0 ? '(ALACAKLI)' : '(BAKİYE YOK)'}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Signature Area */}
                        <div className="flex justify-between mt-12 pt-8 border-t border-slate-200 text-xs text-slate-500 break-inside-avoid">
                            <div className="text-center w-40">
                                <p className="font-bold text-slate-700 mb-8">LİTROS MAKİNA</p>
                                <p className="border-t border-slate-300 pt-1">Kaşe / İmza</p>
                            </div>
                            <div className="text-center w-40">
                                <p className="font-bold text-slate-700 mb-8">MUTABIKIZ / DEĞİLİZ</p>
                                <p className="border-t border-slate-300 pt-1">Kaşe / İmza</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Action & History */}
                <div className="space-y-6 print:hidden">
                    {/* Action Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileCheck2 className="text-blue-600" />
                            Mutabakat İşlemi
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Durum Bildirimi</label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setReconStatus('AGREED')}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${reconStatus === 'AGREED' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Check size={16} /> Mutabıkız
                                    </button>
                                    <button 
                                        onClick={() => setReconStatus('NOT_AGREED')}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${reconStatus === 'NOT_AGREED' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <X size={16} /> Değiliz
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Açıklama / Not</label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-24 resize-none bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Mutabakat notu, fark nedeni vb..."
                                    value={reconNote}
                                    onChange={(e) => setReconNote(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleSaveReconciliation}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                Durumu Kaydet
                            </button>
                        </div>
                    </div>

                    {/* History Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Geçmiş Mutabakatlar</h3>
                        <div className="space-y-3">
                            {history.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Kayıt bulunamadı.</p>
                            ) : (
                                history.map(rec => (
                                    <div key={rec.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-500">{rec.date}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rec.status === 'AGREED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {rec.status === 'AGREED' ? 'Mutabık' : 'Fark Var'}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditReconciliation(rec)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={12} /></button>
                                                    <button onClick={() => handleDeleteReconciliation(rec.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-600 mb-1">
                                            Dönem: {rec.periodStart} / {rec.periodEnd}
                                        </div>
                                        <div className="text-xs font-medium text-slate-800">
                                            Bakiye: {rec.balance.toLocaleString()} TL
                                        </div>
                                        {rec.note && <div className="mt-2 text-xs text-slate-500 italic border-t border-slate-200 pt-1">"{rec.note}"</div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
                <FileCheck2 size={48} className="mb-4 opacity-50" />
                <p>Lütfen işlem yapmak için yukarıdan bir Cari Hesap seçiniz.</p>
            </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editingRecon && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Mutabakat Kaydını Düzenle</h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Durum</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingRecon({...editingRecon, status: 'AGREED'})}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${editingRecon.status === 'AGREED' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Check size={16} /> Mutabıkız
                                </button>
                                <button 
                                    onClick={() => setEditingRecon({...editingRecon, status: 'NOT_AGREED'})}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${editingRecon.status === 'NOT_AGREED' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <X size={16} /> Değiliz
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Not</label>
                            <textarea 
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-24 resize-none bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                value={editingRecon.note || ''}
                                onChange={(e) => setEditingRecon({...editingRecon, note: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">İptal</button>
                        <button onClick={handleUpdateReconciliation} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Güncelle</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ReconciliationPage;