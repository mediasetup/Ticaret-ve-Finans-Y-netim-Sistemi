
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Pencil, FileCheck, Share2, Copy, Trash2, Download, Hexagon } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status, Document } from '../types';

declare var html2pdf: any;

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDocument, addDocument, updateDocument, deleteDocument, companyInfo } = useSales();
  const [doc, setDoc] = useState<Document | undefined>(undefined);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getDocument(id);
      setDoc(found);
    }
  }, [id, getDocument]);

  if (!doc) return <div className="p-8 text-center">Teklif bulunamadı...</div>;

  // ... (All handlers like handleConvertToOrder, handleStatusChange, etc. remain the same)
  const handleConvertToOrder = () => {
    const newOrder: Document = { ...doc, id: `SIP-${Math.floor(Math.random() * 10000)}`, type: DocType.ORDER, status: Status.PENDING, relatedDocId: doc.id, date: new Date().toISOString().split('T')[0] };
    const updatedQuote = { ...doc, status: Status.APPROVED };
    updateDocument(updatedQuote);
    addDocument(newOrder);
    alert('Sipariş başarıyla oluşturuldu.');
    navigate(`/sales/order/${newOrder.id}`);
  };

  const handleStatusChange = (newStatus: string) => {
      const updated = { ...doc, status: newStatus as Status };
      updateDocument(updated);
      setDoc(updated);
  };
  
  const handleDownloadPDF = () => { /* ... same implementation ... */ };
  const handleShare = async () => { /* ... same implementation ... */ };
  const handleDelete = () => { /* ... same implementation ... */ };
  const handleDuplicate = () => { /* ... same implementation ... */ };

  const subTotal = doc.items.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalDiscount = doc.items.reduce((sum, i) => sum + ((i.unitPrice * i.quantity) * (i.discount / 100)), 0);
  const vatAmount = doc.items.reduce((sum, i) => sum + ((i.total || 0) * ((i.taxRate || 20) / 100)), 0);
  const grandTotalWithTax = subTotal - totalDiscount + vatAmount;
  const payableAmount = grandTotalWithTax;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 print:pb-0 print:max-w-none">
      <div className="flex flex-col md:flex-row justify-between gap-4 no-print">
         {/* ... (Action buttons remain the same) */}
      </div>

      <div id="printable-area" className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:shadow-none print:border-none print:p-0 print:rounded-none doc-container">
         <div className="flex justify-between items-start pb-6 mb-8">
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
               <div className="text-right">
                 <h2 className="text-3xl font-bold text-slate-200 uppercase tracking-widest print:text-slate-300">TEKLİF</h2>
                 <p className="text-xl font-bold text-slate-800 mt-1">#{doc.id}</p>
                 <p className="text-slate-500">{doc.date}</p>
             </div>
         </div>

         <div className="grid grid-cols-2 gap-12 mb-8">
            <div>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Sayın</h3>
               <div className="text-base text-slate-800">
                   <p className="font-bold text-lg mb-1">{doc.customer.name}</p>
                   <p className="whitespace-pre-line text-slate-600 mb-2">{doc.customer.address}</p>
                   {doc.customer.city && <p className="text-slate-600">{doc.customer.district} / {doc.customer.city}</p>}
                   
                   {(doc.customer.taxNo || doc.customer.phone) && (
                       <div className="mt-3 pt-3 border-t border-slate-100 text-slate-500 text-sm space-y-1">
                           {doc.customer.taxOffice && <p>V.D.: {doc.customer.taxOffice}</p>}
                           {doc.customer.taxNo && <p>VKN/TCKN: {doc.customer.taxNo}</p>}
                           {doc.customer.phone && <p>Tel: {doc.customer.phone}</p>}
                       </div>
                   )}
               </div>
            </div>
            
            <div className="text-right">
               <div className="bg-slate-50 rounded-lg p-5 print:bg-transparent print:border print:border-slate-100 w-fit ml-auto">
                   <div className="text-left">
                        <span className="text-sm font-bold text-slate-500 uppercase block mb-1">Geçerlilik Tarihi</span>
                        <p className="font-medium text-slate-800">{doc.paymentDueDate || '-'}</p>
                   </div>
               </div>
            </div>
         </div>

         <table className="w-full text-left text-sm mb-8 border-collapse">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs border-b border-t border-slate-200">
                <tr>
                    <th className="py-3 px-4 font-bold rounded-tl-lg">No</th>
                    <th className="py-3 px-4 font-bold">Hizmet / Ürün Adı</th>
                    <th className="py-3 px-4 font-bold">Açıklama</th>
                    <th className="py-3 px-4 font-bold text-center">Miktar</th>
                    <th className="py-3 px-4 font-bold text-right">Birim Fiyat</th>
                    <th className="py-3 px-4 font-bold text-right">İndirim</th>
                    <th className="py-3 px-4 font-bold text-center">KDV</th>
                    <th className="py-3 px-4 font-bold text-right rounded-tr-lg">Toplam</th>
                </tr>
            </thead>
            <tbody className="text-slate-700">
                {doc.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-none page-break-inside-avoid">
                        <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{item.sku}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{item.productName}</td>
                        <td className="py-3 px-4 text-center align-top font-medium">{item.quantity} {item.unit}</td>
                        <td className="py-3 px-4 text-right align-top">{item.unitPrice.toLocaleString()} {doc.currency}</td>
                        <td className="py-3 px-4 text-right align-top text-xs text-slate-500">{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                        <td className="py-3 px-4 text-center align-top text-xs">%{item.taxRate}</td>
                        <td className="py-3 px-4 text-right align-top font-bold text-slate-900">{item.total.toLocaleString()} {doc.currency}</td>
                    </tr>
                ))}
            </tbody>
         </table>
         
         <div className="flex justify-end border-t border-slate-200 pt-6">
              <div className="w-96 space-y-2 text-right">
                 <div className="flex justify-between text-sm text-slate-600"><span>Mal Hizmet Toplam Tutarı</span><span>{subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                 <div className="flex justify-between text-sm text-slate-600"><span>Toplam İndirim</span><span>{totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                 <div className="flex justify-between text-sm text-slate-600"><span>Hesaplanan KDV (%20)</span><span>{vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                 <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-200"><span>Vergiler Dahil Toplam Tutar</span><span>{grandTotalWithTax.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                 <div className="flex justify-between text-xl font-bold text-slate-900 bg-slate-100 p-2 rounded-lg mt-2"><span>TOPLAM TUTAR</span><span>{payableAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
