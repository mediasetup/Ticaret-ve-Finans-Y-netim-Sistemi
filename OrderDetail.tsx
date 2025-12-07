
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, FileCode, Pencil, Trash2, X, Download, Plus, Save, Calendar, Clock, CreditCard, Truck, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { DocType, Status, ItemStatus, LineItem, Document, Payment, Currency } from '../types';

declare var html2pdf: any;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDocument, updateDocument, addDocument, documents, deleteDocument, addPayment, updatePayment, deletePayment, payments, accounts, einvoiceConfig, companyInfo } = useSales();
  const [doc, setDoc] = useState<Document | undefined>(undefined);
  
  // ... (rest of the state remains the same)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceQuantities, setInvoiceQuantities] = useState<{[key: string]: number}>({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payCurrency, setPayCurrency] = useState<Currency>('TRY');
  const [payExchangeRate, setPayExchangeRate] = useState<number>(1.0);
  const [payDesc, setPayDesc] = useState('Fatura Tahsilatı');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [useCurrentRate, setUseCurrentRate] = useState(true); 
  const [processingRate, setProcessingRate] = useState(1.0); 
  const [editingTerminIndex, setEditingTerminIndex] = useState<number | null>(null);
  const [tempTerminDate, setTempTerminDate] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEInvoice, setIsSendingEInvoice] = useState(false);
  
  useEffect(() => {
    if (id) {
      const found = getDocument(id);
      if (found) {
        setDoc(found);
        setPayCurrency(found.currency); 
      }
    }
  }, [id, getDocument, documents]);

  // ... (rest of the hooks remain the same)
  
  if (!doc) return <div className="p-8 text-center">Yükleniyor veya bulunamadı...</div>;

  const isInvoice = doc.type === DocType.INVOICE;

  // GIB FORMAT FINANCIAL CALCULATION
  const subTotal = doc.items.reduce((sum, item) => sum + (item.total || 0), 0); // Mal Hizmet Toplam Tutarı
  const totalDiscount = doc.items.reduce((sum, i) => sum + ((i.unitPrice * i.quantity) * (i.discount / 100)), 0); // Toplam İndirim
  const taxBase = subTotal - totalDiscount; // KDV Matrahı
  const vatAmount = doc.items.reduce((sum, i) => sum + ((i.total || 0) * ((i.taxRate || 20) / 100)), 0); // Hesaplanan KDV
  const grandTotalWithTax = taxBase + vatAmount; // Vergiler Dahil Toplam Tutar
  const payableAmount = grandTotalWithTax; // Ödenecek Tutar

  // ... (other handlers like handleDelete, handleEdit, etc. remain the same)
  const goBack = () => navigate(-1);
  
  const generateUBLXML = () => {
      if (!doc || !companyInfo) return;

      const itemsXML = doc.items.map((item, index) => `
        <cac:InvoiceLine>
            <cbc:ID>${index + 1}</cbc:ID>
            <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
            <cbc:LineExtensionAmount currencyID="${doc.currency}">${item.total.toFixed(2)}</cbc:LineExtensionAmount>
            <cac:TaxTotal>
                <cbc:TaxAmount currencyID="${doc.currency}">${(item.total * (item.taxRate / 100)).toFixed(2)}</cbc:TaxAmount>
                <cac:TaxSubtotal>
                    <cbc:TaxableAmount currencyID="${doc.currency}">${item.total.toFixed(2)}</cbc:TaxableAmount>
                    <cbc:TaxAmount currencyID="${doc.currency}">${(item.total * (item.taxRate / 100)).toFixed(2)}</cbc:TaxAmount>
                    <cac:TaxCategory>
                        <cbc:Percent>${item.taxRate}</cbc:Percent>
                        <cac:TaxScheme><cbc:Name>KDV</cbc:Name></cac:TaxScheme>
                    </cac:TaxCategory>
                </cac:TaxSubtotal>
            </cac:TaxTotal>
            <cac:Item>
                <cbc:Name>${item.productName}</cbc:Name>
            </cac:Item>
            <cac:Price>
                <cbc:PriceAmount currencyID="${doc.currency}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
            </cac:Price>
        </cac:InvoiceLine>`).join('');

      const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
    <cbc:ID>${doc.id}</cbc:ID>
    <cbc:UUID>${doc.eInvoiceETTN || 'GENERATED-UUID-ON-SEND'}</cbc:UUID>
    <cbc:IssueDate>${doc.date}</cbc:IssueDate>
    <cbc:IssueTime>${doc.createdAt ? new Date(doc.createdAt).toTimeString().split(' ')[0] : '00:00:00'}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
    <cbc:Note>Fatura Notları: ${doc.notes || ''}</cbc:Note>
    <cbc:DocumentCurrencyCode>${doc.currency}</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyName><cbc:Name>${companyInfo.name}</cbc:Name></cac:PartyName>
            <cac:PostalAddress><cbc:StreetName>${companyInfo.address}</cbc:StreetName></cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:Name>${companyInfo.taxOffice}</cbc:Name>
                <cac:TaxScheme><cbc:Name>VD</cbc:Name></cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyIdentification><cbc:ID schemeID="VKN">${companyInfo.taxNo}</cbc:ID></cac:PartyIdentification>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyName><cbc:Name>${doc.customer.name}</cbc:Name></cac:PartyName>
            <cac:PostalAddress><cbc:StreetName>${doc.customer.address}</cbc:StreetName></cac:PostalAddress>
            <cac:PartyTaxScheme>
                 <cbc:Name>${doc.customer.taxOffice}</cbc:Name>
                 <cac:TaxScheme><cbc:Name>VD</cbc:Name></cac:TaxScheme>
            </cac:PartyTaxScheme>
             <cac:PartyIdentification><cbc:ID schemeID="VKN">${doc.customer.taxNo}</cbc:ID></cac:PartyIdentification>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${doc.currency}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${doc.currency}">${taxBase.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${doc.currency}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:Percent>20</cbc:Percent>
                <cac:TaxScheme><cbc:Name>KDV</cbc:Name></cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${doc.currency}">${subTotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${doc.currency}">${taxBase.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${doc.currency}">${grandTotalWithTax.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${doc.currency}">${payableAmount.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
    ${itemsXML}
</Invoice>`;

      const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.id}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  const handleDownloadPDF = () => { /* ... (This handler remains the same) */ };
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:pb-0 print:max-w-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
         {/* ... (Action buttons remain the same) */}
      </div>

      <div id="printable-area" className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:shadow-none print:border-none print:p-0">
           {/* GIB FORMAT HEADER */}
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
               <div className="text-right shrink-0">
                   <h2 className="text-3xl font-bold text-slate-200 uppercase tracking-widest print:text-slate-300">{isInvoice ? 'FATURA' : 'SİPARİŞ'}</h2>
                   <p className="text-xl font-bold text-slate-800 mt-1">#{doc.id}</p>
                   <p className="text-slate-500">{doc.date}</p>
                   {/* ... (Status badges remain the same) */}
               </div>
          </div>
          
          <div className="grid grid-cols-2 gap-12 mb-8">
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

          {/* GIB FORMAT FINANCIAL SUMMARY */}
          <div className="flex justify-end border-t border-slate-200 pt-6">
               <div className="w-96 space-y-2 text-right">
                  <div className="flex justify-between text-sm text-slate-600"><span>Mal Hizmet Toplam Tutarı</span><span>{subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                  <div className="flex justify-between text-sm text-slate-600"><span>Toplam İndirim</span><span>{totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                  <div className="flex justify-between text-sm text-slate-600"><span>Hesaplanan KDV (%20)</span><span>{vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                  <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-200"><span>Vergiler Dahil Toplam Tutar</span><span>{grandTotalWithTax.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
                  <div className="flex justify-between text-xl font-bold text-slate-900 bg-slate-100 p-2 rounded-lg mt-2"><span>ÖDENECEK TUTAR</span><span>{payableAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} {doc.currency}</span></div>
              </div>
          </div>
      </div>
      
      {/* ... (Modals and other UI parts remain the same) */}
    </div>
  );
};

export default OrderDetail;
