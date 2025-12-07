
import React, { useState, useMemo } from 'react';
import { 
  BarChart2, PieChart, TrendingUp, Package, Users, Wallet, 
  Calendar, Download, Filter, ArrowRight, DollarSign, FileText, Search, Layers 
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status } from '../types';

// Report Categories and Types
type ReportCategory = 'STOCK' | 'CURRENT' | 'SALES' | 'FINANCE';
type ReportType = 
  | 'STOCK_STATUS' | 'FIFO_PROFIT' | 'STOCK_MOVEMENT'
  | 'CURRENT_BALANCES' | 'COLLECTION_PERF' | 'OVERDUE'
  | 'SALES_ANALYSIS' | 'PROFIT_LOSS'
  | 'CASH_BANK';

const Reports = () => {
  const { documents, products, customers, payments, accounts } = useSales();
  
  // State
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('STOCK');
  const [activeReport, setActiveReport] = useState<ReportType>('STOCK_STATUS');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]); // Jan 1st
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today

  // Critical Filters
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Derived Data: Categories
  const categories = useMemo(() => {
      const cats = new Set(products.map(p => p.category).filter(Boolean));
      return ['ALL', ...Array.from(cats)];
  }, [products]);

  // Helpers
  const formatCurrency = (amount: number, currency = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
  };

  const isInDateRange = (dateStr: string) => {
    return dateStr >= startDate && dateStr <= endDate;
  };

  // --- DATA CALCULATION ENGINE ---
  const reportData = useMemo(() => {
    // Filter Helpers
    const matchesProduct = (name: string, sku: string, category: string) => {
        const term = searchProduct.toLowerCase();
        const nameMatch = !term || name.toLowerCase().includes(term) || sku.toLowerCase().includes(term);
        const catMatch = selectedCategory === 'ALL' || category === selectedCategory;
        return nameMatch && catMatch;
    };

    const matchesCustomer = (name: string) => {
        const term = searchCustomer.toLowerCase();
        return !term || name.toLowerCase().includes(term);
    };

    switch (activeReport) {
      // A. STOCK & FIFO
      case 'STOCK_STATUS':
        return products
            .filter(p => matchesProduct(p.name, p.sku, p.category))
            .map(p => ({
                id: p.id,
                col1: p.name,
                col2: p.sku,
                col3: p.category,
                col4: `${p.stock} Adet`, // Current Stock
                col5: formatCurrency(p.cost * p.stock), // Total Value (Cost)
                raw: p
            }));

      case 'FIFO_PROFIT':
        // Logic: Find all invoiced items, calculate Revenue vs Cost
        const soldItems: any[] = [];
        documents
          .filter(d => d.type === DocType.INVOICE && isInDateRange(d.date) && matchesCustomer(d.customer.name))
          .forEach(doc => {
             doc.items.forEach(item => {
                 const product = products.find(p => p.id === item.productId || p.name === item.productName);
                 const category = product?.category || 'Genel';
                 const cost = product ? product.cost : 0;
                 
                 // Apply Product Filters
                 if (matchesProduct(item.productName, '', category)) {
                     const revenue = item.total; // Total line amount (qty * price - discount)
                     const cogs = item.quantity * cost; // Cost of Goods Sold
                     
                     soldItems.push({
                         id: `${doc.id}-${item.productId}`,
                         col1: doc.date,
                         col2: `${doc.id} / ${doc.customer.name}`,
                         col3: item.productName,
                         col4: `${item.quantity} ${item.unit || 'Adet'}`,
                         col5: formatCurrency(revenue, doc.currency),
                         col6: formatCurrency(cogs, 'TRY'), // Cost is base currency
                         col7: formatCurrency(revenue * (doc.exchangeRate || 1) - cogs, 'TRY'), // Profit in TRY
                         isProfit: (revenue * (doc.exchangeRate || 1) - cogs) > 0
                     });
                 }
             });
          });
        return soldItems;

      // B. CURRENT ACCOUNTS
      case 'CURRENT_BALANCES':
        return customers
           .filter(c => matchesCustomer(c.name))
           .map(c => {
               let debt = 0; // Borç (Faturalar)
               let credit = 0; // Alacak (Ödemeler)
               
               documents.filter(d => d.customer.id === c.id && d.type === DocType.INVOICE).forEach(d => {
                   debt += d.totalAmount * (d.exchangeRate || 1);
               });
               
               payments.filter(p => p.customerId === c.id).forEach(p => {
                   credit += p.amount * (p.exchangeRate || 1);
               });
               
               const balance = debt - credit;
               
               return {
                   id: c.id,
                   col1: c.name,
                   col2: c.city || '-',
                   col3: formatCurrency(debt),
                   col4: formatCurrency(credit),
                   col5: formatCurrency(balance),
                   isNegative: balance > 0 // Positive balance means debt for customer
               };
           });

      case 'OVERDUE':
        // Vadesi geçmiş ödenmemiş faturalar
        const today = new Date().toISOString().split('T')[0];
        return documents
            .filter(d => d.type === DocType.INVOICE && d.status !== Status.PAID && d.paymentDueDate && d.paymentDueDate < today)
            .filter(d => matchesCustomer(d.customer.name))
            .map(d => ({
                id: d.id,
                col1: d.customer.name,
                col2: d.id,
                col3: d.paymentDueDate, // Vade
                col4: `${Math.floor((new Date(today).getTime() - new Date(d.paymentDueDate!).getTime()) / (1000 * 3600 * 24))} Gün`, // Gecikme
                col5: formatCurrency(d.totalAmount, d.currency)
            }));

      // C. SALES
      case 'SALES_ANALYSIS':
          const salesByCustomer: Record<string, number> = {};
          documents
            .filter(d => d.type === DocType.INVOICE && isInDateRange(d.date))
            .filter(d => matchesCustomer(d.customer.name))
            .forEach(d => {
                const amountTRY = d.totalAmount * (d.exchangeRate || 1);
                salesByCustomer[d.customer.name] = (salesByCustomer[d.customer.name] || 0) + amountTRY;
            });
          return Object.entries(salesByCustomer).map(([name, total], idx) => ({
              id: idx,
              col1: name,
              col2: formatCurrency(total)
          })).sort((a,b) => parseFloat(b.col2.replace(/[^0-9,-]+/g,"")) - parseFloat(a.col2.replace(/[^0-9,-]+/g,"")));

      // D. FINANCIAL
      case 'CASH_BANK':
          return accounts.map(acc => {
              // Calculate flows in range
              const ins = payments
                  .filter(p => p.accountId === acc.id && p.type === 'COLLECTION' && isInDateRange(p.date))
                  .reduce((sum, p) => sum + p.amount, 0);
              
              // Only current balance is stored in account, flow is derived
              return {
                  id: acc.id,
                  col1: acc.name,
                  col2: acc.type === 'BANK' ? 'Banka' : 'Kasa',
                  col3: formatCurrency(ins, acc.currency), // Giriş
                  col4: '-', // Çıkış (Expense module not implemented yet)
                  col5: formatCurrency(acc.balance, acc.currency)
              };
          });

      default:
        return [];
    }
  }, [activeReport, products, documents, customers, payments, accounts, startDate, endDate, searchProduct, searchCustomer, selectedCategory]);

  const getHeaders = () => {
      switch(activeReport) {
          case 'STOCK_STATUS': return ['Ürün Adı', 'SKU', 'Kategori', 'Mevcut Stok', 'Stok Değeri (Maliyet)'];
          case 'FIFO_PROFIT': return ['Tarih', 'Belge / Cari', 'Ürün', 'Miktar', 'Satış Tutarı', 'Maliyet (FIFO)', 'Brüt Kar'];
          case 'CURRENT_BALANCES': return ['Cari Ünvanı', 'Şehir', 'Toplam Borç', 'Toplam Ödeme', 'Güncel Bakiye (TL)'];
          case 'OVERDUE': return ['Cari Ünvanı', 'Fatura No', 'Vade Tarihi', 'Gecikme Süresi', 'Tutar'];
          case 'SALES_ANALYSIS': return ['Müşteri', 'Toplam Hacim (TL)'];
          case 'CASH_BANK': return ['Hesap Adı', 'Tür', 'Dönem İçi Giriş', 'Dönem İçi Çıkış', 'Güncel Bakiye'];
          default: return [];
      }
  };

  const handleExportCSV = () => {
      const headers = getHeaders();
      const rows = reportData.map((row: any) => {
          // Extract col1...colN dynamic keys
          return Object.keys(row)
            .filter(k => k.startsWith('col'))
            .sort()
            .map(k => `"${row[k]}"`)
            .join(',');
      });
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `${activeReport}_Raporu.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const renderSidebarItem = (cat: ReportCategory, label: string, icon: any) => (
      <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 px-3 flex items-center gap-2">
              {React.createElement(icon, { size: 14 })} {label}
          </h3>
          <div className="space-y-1">
              {cat === 'STOCK' && (
                  <>
                    <button onClick={() => { setActiveCategory('STOCK'); setActiveReport('STOCK_STATUS'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeReport === 'STOCK_STATUS' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Stok Envanter Durumu</button>
                    <button onClick={() => { setActiveCategory('STOCK'); setActiveReport('FIFO_PROFIT'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeReport === 'FIFO_PROFIT' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>FIFO Maliyet ve Kar/Zarar</button>
                  </>
              )}
              {cat === 'CURRENT' && (
                  <>
                    <button onClick={() => { setActiveCategory('CURRENT'); setActiveReport('CURRENT_BALANCES'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeReport === 'CURRENT_BALANCES' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Güncel Cari Bakiyeler</button>
                    <button onClick={() => { setActiveCategory('CURRENT'); setActiveReport('OVERDUE'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeReport === 'OVERDUE' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Vade Farkı / Gecikme</button>
                  </>
              )}
              {cat === 'SALES' && (
                  <>
                    <button onClick={() => { setActiveCategory('SALES'); setActiveReport('SALES_ANALYSIS'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeReport === 'SALES_ANALYSIS' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Satış Analiz Raporu</button>
                  </>
              )}
              {cat === 'FINANCE' && (
                  <>
                    <button onClick={() => { setActiveCategory('FINANCE'); setActiveReport('CASH_BANK'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeReport === 'CASH_BANK' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Kasa / Banka Durumu</button>
                  </>
              )}
          </div>
      </div>
  );

  // Conditions for showing filters
  const showProductFilter = ['STOCK_STATUS', 'FIFO_PROFIT'].includes(activeReport);
  const showCustomerFilter = ['FIFO_PROFIT', 'CURRENT_BALANCES', 'OVERDUE', 'SALES_ANALYSIS'].includes(activeReport);
  const showDateFilter = !['STOCK_STATUS', 'CURRENT_BALANCES'].includes(activeReport); // Stock/Current are snapshots

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border border-slate-200 rounded-xl p-4 overflow-y-auto shrink-0 print:hidden">
          <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">Raporlar</h2>
              <p className="text-xs text-slate-500">Detaylı analiz ve çıktılar</p>
          </div>
          
          {renderSidebarItem('STOCK', 'Stok & FIFO', Package)}
          {renderSidebarItem('CURRENT', 'Cari Hesaplar', Users)}
          {renderSidebarItem('SALES', 'Satışlar', TrendingUp)}
          {renderSidebarItem('FINANCE', 'Finansal', Wallet)}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden print:border-none">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 print:hidden">
              <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                      {activeReport === 'STOCK_STATUS' && 'Stok Envanter Durumu'}
                      {activeReport === 'FIFO_PROFIT' && 'FIFO Maliyet & Kârlılık Raporu'}
                      {activeReport === 'CURRENT_BALANCES' && 'Güncel Cari Bakiyeler'}
                      {activeReport === 'OVERDUE' && 'Gecikmiş Alacaklar Raporu'}
                      {activeReport === 'SALES_ANALYSIS' && 'Satış Performans Analizi'}
                      {activeReport === 'CASH_BANK' && 'Kasa & Banka Varlık Raporu'}
                  </h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  {/* DYNAMIC FILTERS */}
                  
                  {showCustomerFilter && (
                      <div className="relative group">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input 
                              type="text" 
                              placeholder="Müşteri Ara..." 
                              value={searchCustomer}
                              onChange={(e) => setSearchCustomer(e.target.value)}
                              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40 focus:w-56 transition-all outline-none focus:ring-2 focus:ring-blue-500"
                          />
                      </div>
                  )}

                  {showProductFilter && (
                      <>
                        <div className="relative group">
                            <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Ürün Ara..." 
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40 focus:w-56 transition-all outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-8 pr-8 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                            >
                                {categories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'Tüm Kategoriler' : c}</option>)}
                            </select>
                        </div>
                      </>
                  )}

                  {showDateFilter && (
                      <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-sm">
                          <Calendar size={14} className="text-slate-400 mr-2" />
                          <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                            className="text-sm outline-none w-28 text-slate-600"
                          />
                          <ArrowRight size={14} className="text-slate-300 mx-2" />
                          <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                            className="text-sm outline-none w-28 text-slate-600"
                          />
                      </div>
                  )}
                  
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm ml-auto xl:ml-0"
                  >
                      <Download size={16} /> Excel
                  </button>
              </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs sticky top-0 z-10 shadow-sm">
                      <tr>
                          {getHeaders().map((h, i) => (
                              <th key={i} className={`px-6 py-3 font-bold ${i > 1 ? 'text-right' : ''}`}>{h}</th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {reportData.length === 0 ? (
                          <tr>
                              <td colSpan={getHeaders().length} className="px-6 py-12 text-center text-slate-400">
                                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                  Veri bulunamadı. Filtreleri kontrol edin.
                              </td>
                          </tr>
                      ) : (
                          reportData.map((row: any, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-3 font-medium text-slate-800">{row.col1}</td>
                                  <td className="px-6 py-3 text-slate-600">{row.col2}</td>
                                  {row.col3 && <td className="px-6 py-3 text-right">{row.col3}</td>}
                                  {row.col4 && <td className="px-6 py-3 text-right">{row.col4}</td>}
                                  {row.col5 && (
                                      <td className={`px-6 py-3 text-right font-bold ${
                                          activeReport === 'CURRENT_BALANCES' && row.isNegative ? 'text-red-600' : 
                                          activeReport === 'CURRENT_BALANCES' ? 'text-emerald-600' : 'text-slate-800'
                                      }`}>
                                          {row.col5}
                                      </td>
                                  )}
                                  {row.col6 && <td className="px-6 py-3 text-right text-slate-500">{row.col6}</td>}
                                  {row.col7 && (
                                      <td className={`px-6 py-3 text-right font-bold ${row.isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                                          {row.col7}
                                      </td>
                                  )}
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
          
          {/* Footer Summary (Context Sensitive) */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between print:hidden">
              <div>
                  {activeReport === 'FIFO_PROFIT' && <span>* Maliyetler Ürün Kartındaki (FIFO) maliyet değeri üzerinden hesaplanmıştır.</span>}
                  {activeReport === 'CURRENT_BALANCES' && <span>* Dövizli işlemler güncel TCMB kuru ile TL'ye çevrilerek toplanmıştır.</span>}
              </div>
              <div className="font-bold">
                  Toplam Kayıt: {reportData.length}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;
