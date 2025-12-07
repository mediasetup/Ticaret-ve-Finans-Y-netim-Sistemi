
import * as XLSX from 'xlsx';
import { Customer, Document, LineItem, DocType, Status, Currency } from '../types';

// Yardımcı: "1.450,50" -> 1450.50
const parseTurkishMoney = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Noktaları (binlik) kaldır, virgülü (ondalık) noktaya çevir
  const cleanStr = val.toString().replaceAll('.', '').replace(',', '.');
  return parseFloat(cleanStr) || 0;
};

// Yardımcı: "05 Aralık 2025" -> "2025-12-05"
const parseTurkishDate = (dateStr: any): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Excel bazen tarihi sayı (serial) olarak verir
  if (typeof dateStr === 'number') {
    const date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }

  const months: { [key: string]: string } = {
    'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04', 'Mayıs': '05', 'Haziran': '06',
    'Temmuz': '07', 'Ağustos': '08', 'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12',
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };

  try {
    // "05 Aralık 2025" formatını parçala
    const parts = dateStr.trim().split(' ');
    if (parts.length < 3) return new Date().toISOString().split('T')[0];
    
    const day = parts[0].padStart(2, '0');
    const monthName = parts[1];
    const year = parts[2];
    
    // Ay isminden numarayı bul
    const month = months[Object.keys(months).find(m => monthName.toLowerCase().startsWith(m.toLowerCase())) || ''] || '01';

    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Tarih parse hatası:", dateStr, e);
    return new Date().toISOString().split('T')[0];
  }
};

interface ParsedData {
  clients: Partial<Customer>[];
  invoices: any[]; // Supabase insert yapısına uygun geçici obje
  items: any[];    // Supabase insert yapısına uygun geçici obje
}

export const parseParasutExcel = async (file: File): Promise<ParsedData> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // JSON'a çevirirken headerları otomatik algıla
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const clientsMap = new Map<string, Partial<Customer>>();
  const invoicesMap = new Map<string, any>();
  const items: any[] = [];

  // "Fill Down" mantığı için son geçerli faturayı hafızada tutuyoruz
  let currentInvoice: any = null;

  rawRows.forEach((row: any, index: number) => {
    // --- 1. FATURA BAŞLIĞINI TESPİT ET ---
    // Paraşüt çıktısında 'Fatura ismi' veya 'Düzenleme tarihi' doluysa bu yeni bir faturadır.
    // Boşsa, bir önceki faturanın devam eden kalemidir.
    
    const invoiceNumberRaw = row['Fatura ismi'] || row['Fatura no'];
    const dateRaw = row['Düzenleme tarihi'];
    
    // Satırın bir fatura başlığı olup olmadığını kontrol et
    const isHeaderRow = (invoiceNumberRaw && invoiceNumberRaw.toString().trim() !== '') || 
                        (dateRaw && dateRaw.toString().trim() !== '');

    if (isHeaderRow) {
      const invNum = invoiceNumberRaw || `INV-IMP-${Date.now()}-${index}`;
      const clientName = row['Müşteri'] || row['Müşteri Kısa Adı'] || 'Bilinmeyen Müşteri';
      const taxNo = row['Müşteri vergi numarası'] ? row['Müşteri vergi numarası'].toString() : '';
      
      // Müşteri Anahtarı (Varsa VKN, yoksa İsim) - Tekilleştirme için
      const clientKey = taxNo && taxNo.length > 2 ? taxNo : clientName;

      // -- A. Müşteri Verisi Hazırla --
      if (!clientsMap.has(clientKey)) {
        clientsMap.set(clientKey, {
          name: clientName,
          taxNo: taxNo,
          taxOffice: row['Müşteri vergi dairesi'] || '',
          address: row['Gönderim adresi'] || '',
          // Geçici ID, veritabanına yazarken gerçek ID ile eşleşecek
          id: clientKey 
        });
      }

      // -- B. Fatura Verisi Hazırla --
      const issueDate = parseTurkishDate(row['Düzenleme tarihi']);
      const currencyRaw = row['Döviz tipi'] || 'TRY';
      // TRL eski kodunu TRY'ye çevir
      const currency = (currencyRaw === 'TRL' ? 'TRY' : currencyRaw) as Currency;
      
      currentInvoice = {
        invoice_number: invNum,
        client_key: clientKey, // İlişki kurmak için geçici anahtar
        issue_date: issueDate,
        due_date: parseTurkishDate(row['Son tahsilat tarihi']) || issueDate,
        currency: currency,
        exchange_rate: parseTurkishMoney(row['Döviz kuru']) || 1.0,
        total_amount: parseTurkishMoney(row['Genel Toplam']),
        status: Status.INVOICED // İçe aktarılanlar direkt faturalanmış kabul edilir
      };

      if (!invoicesMap.has(invNum)) {
        invoicesMap.set(invNum, currentInvoice);
      }
    }

    // --- 2. KALEM (ITEM) İŞLEME ---
    // Eğer hafızada aktif bir fatura varsa ve bu satırda ürün varsa ekle
    if (currentInvoice && (row['Ürün/hizmet'] || row['Açıklama'])) {
      const productName = row['Ürün/hizmet'] || 'Hizmet Bedeli';
      
      items.push({
        invoice_number_ref: currentInvoice.invoice_number, // Hangi faturaya ait?
        product_name: productName,
        sku: row['Ürün/hizmet kodu'] || '',
        quantity: parseTurkishMoney(row['Miktar']) || 1,
        unit_price: parseTurkishMoney(row['Birim fiyatı']) || 0,
        tax_rate: parseTurkishMoney(row['KDV oranı']) || 20,
        discount: parseTurkishMoney(row['İndirim']) || 0, // Tutar olarak indirim varsa oran hesaplanmalı veya direkt düşülmeli
        total_line_amount: parseTurkishMoney(row['Ürün/hizmet net tutarı']) || 0,
        unit: 'Adet' // Excel'de birim yoksa varsayılan
      });
    }
  });

  return {
    clients: Array.from(clientsMap.values()),
    invoices: Array.from(invoicesMap.values()),
    items: items
  };
};
