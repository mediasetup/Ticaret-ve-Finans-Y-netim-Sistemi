
import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Database, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { parseParasutExcel } from '../utils/parasutParser';
import { DocType } from '../types';

interface InvoiceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InvoiceImportModal: React.FC<InvoiceImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info'|'success'|'error', id: number}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const addLog = (msg: string, type: 'info'|'success'|'error' = 'info') => {
    setLogs(prev => [...prev, { msg, type, id: Date.now() + Math.random() }]);
    // Otomatik scroll için eklenebilir
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLogs([]);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setLogs([]);

    try {
      // 1. Dosya Ayrıştırma
      addLog('Dosya okunuyor ve analiz ediliyor...', 'info');
      const { clients, invoices, items } = await parseParasutExcel(file);
      addLog(`${clients.length} Müşteri, ${invoices.length} Fatura ve ${items.length} Kalem tespit edildi.`, 'success');

      if (invoices.length === 0) {
        throw new Error('Dosyada fatura bulunamadı.');
      }

      // 2. Müşterileri Aktar (Upsert)
      addLog('Müşteriler veritabanına aktarılıyor...', 'info');
      const clientUpsertData = clients.map(c => ({
        name: c.name,
        tax_no: c.taxNo, // DB sütun ismi snake_case olabilir, kontrol edilmeli. Types.ts'de camelCase. 
        // Supabase tarafında kolon isimleriniz ne ise onu kullanın. Types.ts'e göre mapliyoruz:
        email: '', // Excel'de yoksa boş
        taxNo: c.taxNo,
        taxOffice: c.taxOffice,
        address: c.address,
        isLegalEntity: true // Varsayılan
      }));

      // Not: Supabase 'onConflict' için unique constraint gerektirir. 
      // Basitlik için taxNo doluysa taxNo, yoksa name üzerinden eşleşme yapmaya çalışacağız veya tek tek kontrol edeceğiz.
      // Toplu upsert yerine, ID maplemek için tek tek veya map kullanarak gitmek daha güvenli.
      
      const clientLookup: { [key: string]: string } = {}; // Excel Key -> Real DB UUID
      
      for (const client of clients) {
        // Önce var mı diye bak
        let query = supabase.from('customers').select('id');
        if (client.taxNo && client.taxNo.length > 2) {
             query = query.eq('taxNo', client.taxNo);
        } else {
             query = query.eq('name', client.name);
        }
        
        const { data: existing } = await query.single();
        
        let clientId = existing?.id;

        if (!clientId) {
            // Yoksa ekle
            const { data: newClient, error } = await supabase.from('customers').insert({
                id: `CUST-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                name: client.name!,
                taxNo: client.taxNo || '',
                taxOffice: client.taxOffice,
                address: client.address,
                isLegalEntity: true,
                email: ''
            }).select('id').single();
            
            if (error) {
                addLog(`Müşteri eklenemedi (${client.name}): ${error.message}`, 'error');
                continue;
            }
            clientId = newClient.id;
        }
        
        // Lookup tablosuna ekle (client.id parser'dan gelen key, clientId ise DB UUID)
        if (client.id && clientId) {
            clientLookup[client.id] = clientId;
        }
      }
      addLog('Müşteri eşleştirmesi tamamlandı.', 'success');

      // 3. Faturaları Aktar
      addLog('Faturalar oluşturuluyor...', 'info');
      const invoiceLookup: { [key: string]: string } = {}; // Invoice No -> Real DB UUID

      for (const inv of invoices) {
          const dbClientId = clientLookup[inv.client_key];
          if (!dbClientId) {
              addLog(`Fatura (${inv.invoice_number}) için müşteri bulunamadı, atlanıyor.`, 'error');
              continue;
          }

          // Fatura var mı kontrol et (Fatura No ile)
          const { data: existingInv } = await supabase
              .from('documents')
              .select('id')
              .eq('id', inv.invoice_number) // ID olarak Fatura No kullanmayı deneyelim veya title/eInvoiceNumber
              .single();
          
          if (existingInv) {
              // Varsa güncelle veya ID al
              invoiceLookup[inv.invoice_number] = existingInv.id;
              // Opsiyonel: Güncelleme yapılabilir
          } else {
              // Yoksa ekle. ID'yi Fatura No yapabiliriz (Unique ise) veya generate ederiz.
              // Types.ts'deki yapıya uygun obje:
              const newDoc = {
                  id: inv.invoice_number, // ID olarak Fatura No kullanıyoruz
                  title: inv.invoice_number,
                  type: DocType.INVOICE,
                  customer: { id: dbClientId } as any, // Supabase relation için sadece ID yeterli olmayabilir, raw insert yapıyoruz
                  date: inv.issue_date,
                  paymentDueDate: inv.due_date,
                  currency: inv.currency,
                  exchangeRate: inv.exchange_rate,
                  totalAmount: inv.total_amount,
                  status: inv.status,
                  items: [] // Items sonradan eklenecek (JSONB ise direkt buraya, relational ise ayrı)
              };

              // Supabase'e raw insert (Types.ts yapısını JSONB kolonlara uyarlamak gerekebilir)
              // Burada varsayım: 'documents' tablosu JSONB tutuyor veya relational.
              // Senaryo: Relational yapı. 'customer' kolonu yok, 'customerId' var varsayalım.
              // Ama context'te 'customer' obje olarak görünüyor. Muhtemelen JSONB saklanıyor.
              // Biz güvenli yol olarak Document yapısını tam kuralım.
              
              const { data: insertedDoc, error: invError } = await supabase
                  .from('documents')
                  .insert({
                      ...newDoc,
                      customer: await supabase.from('customers').select('*').eq('id', dbClientId).single().then(r => r.data)
                  })
                  .select('id')
                  .single();

              if (invError) {
                  addLog(`Fatura hatası (${inv.invoice_number}): ${invError.message}`, 'error');
              } else {
                  invoiceLookup[inv.invoice_number] = insertedDoc.id;
              }
          }
      }

      // 4. Kalemleri Aktar
      // Bu adım document içindeki 'items' JSONB ise gereksiz, ama relational ise gerekli.
      // Types.ts'de Document interface'inde "items: LineItem[]" var. Bu genellikle JSONB sütunudur.
      // Eğer JSONB ise, yukarıdaki adımda items boş gitti. Şimdi update edelim.
      
      addLog('Fatura kalemleri işleniyor...', 'info');
      
      // Her fatura için itemları grupla
      const invoiceItemsMap: { [key: string]: any[] } = {};
      items.forEach(item => {
          if (!invoiceItemsMap[item.invoice_number_ref]) {
              invoiceItemsMap[item.invoice_number_ref] = [];
          }
          
          invoiceItemsMap[item.invoice_number_ref].push({
              productId: `IMP-${Math.floor(Math.random()*10000)}`, // Geçici ID
              sku: item.sku,
              productName: item.product_name,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unit_price,
              taxRate: item.tax_rate,
              discount: item.discount,
              total: item.total_line_amount
          });
      });

      // Faturaları itemlarla güncelle
      let successCount = 0;
      for (const [invNo, invItems] of Object.entries(invoiceItemsMap)) {
          const docId = invoiceLookup[invNo];
          if (docId) {
              const { error } = await supabase
                  .from('documents')
                  .update({ items: invItems }) // JSONB güncelleme
                  .eq('id', docId);
              
              if (!error) successCount++;
          }
      }

      addLog(`${successCount} Fatura içeriği başarıyla güncellendi.`, 'success');
      addLog('İşlem Tamamlandı!', 'success');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error(error);
      addLog(`Kritik Hata: ${error.message || 'Bilinmeyen bir hata oluştu'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Paraşüt Excel İçe Aktar
          </h3>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Dropzone Area */}
          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-blue-500 hover:bg-slate-50'}
              ${loading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileChange} 
            />
            
            {file ? (
              <div>
                <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="font-medium text-slate-600">Excel dosyasını buraya sürükleyin</p>
                <p className="text-xs text-slate-400 mt-1">veya seçmek için tıklayın (.xlsx)</p>
              </div>
            )}
          </div>

          {/* Logs Console */}
          <div className="bg-slate-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs text-slate-300 shadow-inner">
            {logs.length === 0 && <span className="text-slate-600 block text-center mt-16">... işlem bekleniyor ...</span>}
            {logs.map((log) => (
              <div key={log.id} className={`flex items-start gap-2 mb-1.5 
                ${log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-emerald-400' : 'text-blue-200'}`}>
                {log.type === 'error' ? <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> : 
                 log.type === 'success' ? <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" /> : 
                 <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />}
                <span>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            İptal
          </button>
          <button 
            onClick={handleProcess}
            disabled={!file || loading}
            className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Aktarılıyor...' : 'Aktarımı Başlat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceImportModal;
