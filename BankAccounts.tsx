
import React, { useState, useMemo } from 'react';
import { useSales } from '../context/SalesContext';
import { Account, Currency, Transaction } from '../types';
import { Landmark, Plus, Trash2, Pencil, Wallet, Search, ArrowRightLeft, CreditCard, X, Check, ArrowUpRight, ArrowDownLeft, FileText, Download } from 'lucide-react';

const BankAccounts = () => {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount, addTransaction, transferFunds } = useSales();
  
  // View State: 'LIST' or 'DETAIL'
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  // Editing / New Account State
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState<Partial<Account>>({
      name: '', type: 'BANK', currency: 'TRY', iban: '', balance: 0, bankName: '', branch: ''
  });

  // Transaction Form State
  const [txForm, setTxForm] = useState<{
      type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
      amount: string;
      description: string;
      targetAccountId: string;
      date: string;
  }>({
      type: 'DEPOSIT', amount: '', description: '', targetAccountId: '', date: new Date().toISOString().split('T')[0]
  });

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Filter transactions for the selected account
  const accountHistory = useMemo(() => {
      if (!selectedAccountId) return [];
      return transactions
          .filter(t => t.accountId === selectedAccountId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedAccountId, transactions]);

  // --- ACCOUNT CRUD ---
  const handleOpenAccountModal = (acc?: Account) => {
      if (acc) {
          setEditingAccount(acc);
          setAccountForm({ ...acc });
      } else {
          setEditingAccount(null);
          setAccountForm({ name: '', type: 'BANK', currency: 'TRY', iban: '', balance: 0, bankName: '', branch: '' });
      }
      setIsAccountModalOpen(true);
  };

  const handleSaveAccount = () => {
      if (!accountForm.name) return alert("Hesap adı zorunludur.");
      
      if (editingAccount) {
          updateAccount({ ...editingAccount, ...accountForm } as Account);
      } else {
          addAccount({
              id: `ACC-${Date.now()}`,
              name: accountForm.name!,
              type: accountForm.type || 'BANK',
              currency: accountForm.currency || 'TRY',
              iban: accountForm.iban,
              balance: accountForm.balance || 0,
              bankName: accountForm.bankName,
              branch: accountForm.branch
          });
      }
      setIsAccountModalOpen(false);
  };

  const handleDeleteAccount = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Bu hesabı silmek istediğinize emin misiniz?")) {
          const success = deleteAccount(id);
          if (!success) {
              alert("Bu hesap silinemez çünkü işlem geçmişi veya bağlı tahsilatlar mevcut.");
          }
      }
  };

  // --- TRANSACTION LOGIC ---
  const handleOpenTxModal = () => {
      setTxForm({ 
          type: 'DEPOSIT', 
          amount: '', 
          description: '', 
          targetAccountId: '', 
          date: new Date().toISOString().split('T')[0] 
      });
      setIsTransactionModalOpen(true);
  };

  const handleExecuteTransaction = () => {
      if (!selectedAccount) return;
      const amount = parseFloat(txForm.amount);
      if (isNaN(amount) || amount <= 0) return alert("Geçerli bir tutar giriniz.");

      if (txForm.type === 'TRANSFER') {
          if (!txForm.targetAccountId) return alert("Transfer yapılacak hesabı seçiniz.");
          transferFunds(selectedAccount.id, txForm.targetAccountId, amount, txForm.description);
      } else {
          // Deposit or Withdrawal
          const isDeposit = txForm.type === 'DEPOSIT';
          const finalAmount = isDeposit ? amount : -amount;
          
          addTransaction({
              id: `TX-${Date.now()}`,
              accountId: selectedAccount.id,
              date: txForm.date,
              amount: finalAmount,
              type: txForm.type,
              description: txForm.description || (isDeposit ? 'Para Girişi' : 'Para Çıkışı'),
              balanceAfter: selectedAccount.balance + finalAmount
          });
      }
      setIsTransactionModalOpen(false);
  };

  const handleExportHistory = () => {
      const headers = ['Tarih', 'İşlem Türü', 'Açıklama', 'Tutar', 'Bakiye'];
      const rows = accountHistory.map(t => [
          t.date, t.type, t.description, t.amount, t.balanceAfter
      ].join(','));
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Ekstre_${selectedAccount?.name}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- RENDER ---

  if (view === 'DETAIL' && selectedAccount) {
      return (
          <div className="space-y-6 max-w-7xl mx-auto pb-10">
              {/* Detail Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                          <ArrowRightLeft size={24} className="rotate-180" /> {/* Back Icon */}
                      </button>
                      <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                          <Landmark size={32} />
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedAccount.name}</h2>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                              <span>{selectedAccount.bankName}</span>
                              {selectedAccount.iban && <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{selectedAccount.iban}</span>}
                          </div>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Güncel Bakiye</p>
                      <div className="text-3xl font-bold text-slate-900">
                          {selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                          <span className="text-lg ml-1 text-slate-500">{selectedAccount.currency}</span>
                      </div>
                  </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end gap-3">
                  <button onClick={handleExportHistory} className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50">
                      <Download size={18} /> Dışa Aktar
                  </button>
                  <button onClick={handleOpenTxModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
                      <ArrowRightLeft size={18} /> İşlem Yap (Giriş/Çıkış/Transfer)
                  </button>
              </div>

              {/* Transaction List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                          <tr>
                              <th className="px-6 py-4 font-semibold">Tarih</th>
                              <th className="px-6 py-4 font-semibold">İşlem Türü</th>
                              <th className="px-6 py-4 font-semibold">Açıklama</th>
                              <th className="px-6 py-4 font-semibold text-right">Tutar</th>
                              <th className="px-6 py-4 font-semibold text-right">Bakiye</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {accountHistory.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Bu hesaba ait işlem bulunamadı.</td></tr>
                          ) : (
                              accountHistory.map(tx => (
                                  <tr key={tx.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{tx.date}</td>
                                      <td className="px-6 py-4">
                                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                              tx.amount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                                          }`}>
                                              {tx.amount > 0 ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                                              {tx.type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 font-medium text-slate-700">{tx.description}</td>
                                      <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-6 py-4 text-right text-slate-900 font-medium">
                                          {tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>

              {/* Transaction Modal */}
              {isTransactionModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                              <h3 className="font-bold text-slate-800">Finansal İşlem</h3>
                              <button onClick={() => setIsTransactionModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                          </div>
                          <div className="p-6 space-y-4">
                              <div className="flex bg-slate-100 p-1 rounded-lg">
                                  {(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'] as const).map(type => (
                                      <button 
                                          key={type}
                                          onClick={() => setTxForm({...txForm, type})}
                                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${txForm.type === type ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                      >
                                          {type === 'DEPOSIT' ? 'PARA GİRİŞİ' : type === 'WITHDRAWAL' ? 'PARA ÇIKIŞI' : 'TRANSFER'}
                                      </button>
                                  ))}
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarih</label>
                                  <input type="date" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} />
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tutar</label>
                                  <div className="relative">
                                      <input type="number" className="w-full border border-gray-300 rounded p-2 pl-4 text-lg font-bold bg-white text-gray-900 placeholder-gray-500" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} placeholder="0.00" />
                                      <span className="absolute right-4 top-3 text-slate-400 font-bold text-sm">{selectedAccount.currency}</span>
                                  </div>
                              </div>

                              {txForm.type === 'TRANSFER' && (
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hedef Hesap</label>
                                      <select className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" value={txForm.targetAccountId} onChange={e => setTxForm({...txForm, targetAccountId: e.target.value})}>
                                          <option value="">Seçiniz...</option>
                                          {accounts.filter(a => a.id !== selectedAccount.id && a.currency === selectedAccount.currency).map(acc => (
                                              <option key={acc.id} value={acc.id}>{acc.name} (Bakiye: {acc.balance})</option>
                                          ))}
                                      </select>
                                      <p className="text-[10px] text-slate-400 mt-1">Sadece aynı para birimindeki ({selectedAccount.currency}) hesaplara transfer yapılabilir.</p>
                                  </div>
                              )}

                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                                  <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} placeholder="İşlem açıklaması..." />
                              </div>
                          </div>
                          <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                              <button onClick={() => setIsTransactionModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">İptal</button>
                              <button onClick={handleExecuteTransaction} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Onayla</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Kasa ve Bankalar</h2>
                <p className="text-slate-500">Tüm finansal hesaplarınızın özeti</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => handleOpenAccountModal()} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition-colors">
                    <Plus size={18} /> Banka Hesabı Ekle
                </button>
                <button onClick={() => handleOpenAccountModal()} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 font-medium shadow-sm transition-colors">
                    <Plus size={18} /> Kasa Ekle
                </button>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-4 items-center bg-slate-100 p-2 rounded-lg border border-slate-200 w-full md:w-1/2">
            <button className="flex items-center gap-1 text-slate-600 font-bold text-xs uppercase px-2"><Search size={14}/> Filtrele</button>
            <input type="text" placeholder="Hesap ara..." className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400 text-slate-700" />
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 w-12"></th>
                        <th className="px-6 py-4">Hesap İsmi</th>
                        <th className="px-6 py-4">IBAN / Şube</th>
                        <th className="px-6 py-4">Döviz Cinsi</th>
                        <th className="px-6 py-4 text-right">Bakiye</th>
                        <th className="px-6 py-4 w-20"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {accounts.map(acc => (
                        <tr 
                            key={acc.id} 
                            onClick={() => { setSelectedAccountId(acc.id); setView('DETAIL'); }}
                            className="hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                            <td className="px-6 py-4 text-slate-400">
                                {acc.type === 'BANK' ? <Landmark size={20} /> : <Wallet size={20} />}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">{acc.name}</td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{acc.iban || '-'}</td>
                            <td className="px-6 py-4 font-bold text-slate-600">{acc.currency}</td>
                            <td className="px-6 py-4 text-right">
                                <span className={`font-bold text-lg ${acc.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                    {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                    <span className="text-xs text-slate-400 ml-1">{acc.currency === 'TRY' ? '₺' : acc.currency === 'USD' ? '$' : '€'}</span>
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenAccountModal(acc); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-100"><Pencil size={16}/></button>
                                    <button onClick={(e) => handleDeleteAccount(e, acc.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-100"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Create/Edit Modal */}
        {isAccountModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">{editingAccount ? 'Hesabı Düzenle' : 'Yeni Hesap Ekle'}</h3>
                        <button onClick={() => setIsAccountModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${accountForm.type === 'BANK' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} onClick={() => setAccountForm({...accountForm, type: 'BANK'})}>BANKA</button>
                            <button className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${accountForm.type === 'CASH' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`} onClick={() => setAccountForm({...accountForm, type: 'CASH'})}>KASA</button>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hesap Adı</label>
                            <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} placeholder="Örn: İş Bankası TL" />
                        </div>
                        {accountForm.type === 'BANK' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Banka Adı</label>
                                    <input type="text" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={accountForm.bankName} onChange={e => setAccountForm({...accountForm, bankName: e.target.value})} placeholder="Örn: İş Bankası" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IBAN</label>
                                    <input type="text" className="w-full border border-gray-300 rounded p-2 font-mono text-sm bg-white text-gray-900 placeholder-gray-500" value={accountForm.iban} onChange={e => setAccountForm({...accountForm, iban: e.target.value})} placeholder="TR..." />
                                </div>
                            </>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Döviz</label>
                                <select className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" value={accountForm.currency} onChange={e => setAccountForm({...accountForm, currency: e.target.value as Currency})}>
                                    <option value="TRY">TRY (₺)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açılış Bakiyesi</label>
                                <input type="number" className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-500" value={accountForm.balance} onChange={e => setAccountForm({...accountForm, balance: parseFloat(e.target.value)})} />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => setIsAccountModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">İptal</button>
                        <button onClick={handleSaveAccount} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Kaydet</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default BankAccounts;
