
import { Product, Customer, Document, DocType, Status, Account, Category, User, CompanyInfo } from './types';

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
    name: "LİTROS MAKİNA SANAYİ VE TİCARET A.Ş.",
    taxOffice: "İkitelli",
    taxNo: "1234567890",
    mersisNo: "012345678900001",
    address: "İkitelli OSB. Bağcılar-Güngören San. Sit. 12. Blok No:123 Başakşehir / İSTANBUL",
    phone: "+90 212 123 45 67",
    email: "info@litrosmakina.com",
    website: "www.litrosmakina.com"
};

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Yusuf Enes Koçak', email: 'yusuf@litrosmakina.com', role: 'ADMIN', isActive: true, lastLogin: '2025-12-05T10:30:00' },
    { id: 'u2', name: 'Ahmet Yılmaz', email: 'ahmet@litrosmakina.com', role: 'SALES', isActive: true, lastLogin: '2025-12-04T16:20:00' },
    { id: 'u3', name: 'Ayşe Demir', email: 'ayse@litrosmakina.com', role: 'ACCOUNTANT', isActive: true, lastLogin: '2025-12-05T09:00:00' },
    { id: 'u4', name: 'Mehmet Depo', email: 'depo@litrosmakina.com', role: 'STOCK', isActive: true, lastLogin: '2025-12-01T08:00:00' }
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc1', name: 'Merkez TL Kasa', type: 'CASH', currency: 'TRY', balance: 50000 },
  { id: 'acc2', name: 'İş Bankası TL', type: 'BANK', currency: 'TRY', balance: 1250000, iban: 'TR12 0006 4000 0000 1234 5678 90' },
  { id: 'acc3', name: 'Vakıf Katılım USD', type: 'BANK', currency: 'USD', balance: 14500, iban: 'TR45 0006 4000 0000 1234 5678 90' },
  { id: 'acc4', name: 'Vakıf Katılım EUR', type: 'BANK', currency: 'EUR', balance: 8200, iban: 'TR67 0006 4000 0000 1234 5678 90' }
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Pensler', description: 'Hassas tutucu pens çeşitleri' },
  { id: 'cat2', name: 'Guide Bush', description: 'Rehber burçlar' },
  { id: 'cat3', name: 'Sürücü Pensler', description: 'Sürücü mekanizma parçaları' },
  { id: 'cat4', name: 'Tutucular', description: 'Takım tutucular ve kafalar' },
  { id: 'cat5', name: 'Kesici Takımlar', description: 'Kama ve kesici uçlar' },
  { id: 'cat6', name: 'Aksesuarlar', description: 'Anahtar ve adaptörler' }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', sku: '173E.T1.10', name: '173E Ø10 Sub Pens', category: 'Pensler', stock: 50, price: 40, cost: 25, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p2', sku: '145E.T1.08', name: 'F25 Ø8 Kanalsız Pens', category: 'Pensler', stock: 45, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p3', sku: 'T223.A1.08', name: 'T223 Ø8 Guide Bush Gisstec', category: 'Guide Bush', stock: 20, price: 150, cost: 90, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p4', sku: 'FM.09.08', name: 'M9x1L Ø8 Sürücü Pens', category: 'Sürücü Pensler', stock: 30, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p5', sku: 'F605.T1.16,5', name: 'F605 Ø16,5 Karbürsüz Guide Bush', category: 'Guide Bush', stock: 15, price: 55, cost: 35, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p6', sku: '138E.T1.16,5', name: '138E F20 Ø16,5 Pens (Arkası Kamalı)', category: 'Pensler', stock: 25, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p7', sku: 'FM.08.16,5', name: 'M8x0,75R Ø16,5 Sürücü Pens', category: 'Sürücü Pensler', stock: 40, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p8', sku: 'FP.05.16', name: "20'lik D20 P5x3 Ø16 Pimli Sürücü Pensi", category: 'Sürücü Pensler', stock: 60, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p9', sku: '145E.T1.10.K', name: '145E F25 Ø10 Main Pens', category: 'Pensler', stock: 35, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p10', sku: '145E.T1.04', name: '145E F25 Ø4 Sub Pens', category: 'Pensler', stock: 35, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p11', sku: 'T223.T1.10', name: 'T223 F25 Ø10 Guide Bush', category: 'Guide Bush', stock: 12, price: 135, cost: 85, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p12', sku: 'FM.09.10', name: 'M9x1 Ø10 Sürücü Pensi', category: 'Sürücü Pensler', stock: 28, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p13', sku: 'MA16', name: 'ER16 Mini Anahtar', category: 'Aksesuarlar', stock: 100, price: 6, cost: 3, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p14', sku: 'ER40.H.25', name: 'ER40 Ø25 Ultra Hassas Pens', category: 'Pensler', stock: 200, price: 14, cost: 8, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p15', sku: 'GT-25-BT40', name: 'BT40 ER25 Ayarlanabilir Açılı Kafa Termin: STOKTA MEVCUT', category: 'Tutucular', stock: 5, price: 9050, cost: 6500, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-01' },
  { id: 'p16', sku: 'F391.T1.5,2', name: 'F391 T16 Ø5,2 Guide Bush', category: 'Guide Bush', stock: 18, price: 110, cost: 70, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p17', sku: '1212E.T1.5,2', name: '1212E F16 Ø5,2 Main Pens', category: 'Pensler', stock: 40, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p18', sku: '1212E.T1.5', name: '1212E F16 Ø5 Sub Pens', category: 'Pensler', stock: 40, price: 30, cost: 18, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p19', sku: 'SPA.M9-M12-1,25', name: 'M9x1-M12x1,25 Sürücü Pens Adaptörü', category: 'Aksesuarlar', stock: 25, price: 137.50, cost: 85, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p20', sku: 'IN-10-H7/J59', name: 'KAMA ELMASI, IN-10-H7 / J59, 10MM', category: 'Kesici Takımlar', stock: 150, price: 57, cost: 35, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
  { id: 'p21', sku: 'SK40-SSF-8-160', name: 'Tezgah Takım Tutucusu (KESİCİ UÇ HARİÇ) {demirbaş}', category: 'Tutucular', stock: 10, price: 237, cost: 150, currency: 'EUR', unit: 'Adet', vatRate: 20, trackStock: true, lastRestockDate: '2025-11-20' },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'ANT TRAKTÖR YEDEK PARÇA VE MAKİNA SAN. TİC. LTD. ŞTİ.', email: 'info@anttraktor.com', taxNo: '0701148584', taxOffice: 'ESENYURT', address: 'Orhan Gazi Mah. Isıso San. Sit. 2.Yol Sokak B Blok No:12 Esenyurt İstanbul', city: 'İstanbul', district: 'Esenyurt', isLegalEntity: true },
  { id: 'c2', name: 'KPS AUTOMOTIVE OTOMOTİV YEDEK PARÇA SANAYİ VE TİCARET A.Ş.', email: 'info@kpsautomotive.com', taxNo: '5891025779', taxOffice: 'ÇEKİRGE', address: 'Çalı Mah. 22(410) Sok. No:5/2 Nilüfer Bursa', city: 'Bursa', district: 'Nilüfer', isLegalEntity: true },
  { id: 'c3', name: 'SFSFIX PLASTİK METAL ÜRÜNLERİ NAKLİYE SANAYİ VE TİCARET LİMİTED ŞİRKETİ', email: 'info@sfsfix.com', taxNo: '7691915598', taxOffice: 'İLYASBEY', address: 'ÇAYIROVA MAH. 5210. SK. NO: 59 İÇ KAPI NO: 1 Çayırova Kocaeli', city: 'Kocaeli', district: 'Çayırova', isLegalEntity: true },
  { id: 'c4', name: 'ÖZIŞIK MAKİNA TESİSAT HIRDAVAT İNŞAAT VE MALZEMELERİ SAN. TİC. LTD. ŞTİ.', email: 'info@ozisikmakina.com', taxNo: '6940053668', taxOffice: 'ESKİŞEHİR', address: '75. Yıl Sultandere Mah. 11229. Sok. Oto Sanayiciler Sit. Çarşı A Grubu No:4-6 Odunpazarı Eskişehir', city: 'Eskişehir', district: 'Odunpazarı', isLegalEntity: true },
  { id: 'c5', name: 'NANOTECH KESİCİ TAKIM MAKİNA SAN. VE TİC. LTD. ŞTİ.', email: 'info@nanotech.com', taxNo: '6290474484', taxOffice: 'İLYASBEY', address: 'GEBZE PLASTİKÇİLER OSB. İNÖNÜ MAH. 34. SOK. NO:7 Gebze Kocaeli', city: 'Kocaeli', district: 'Gebze', isLegalEntity: true },
  { id: 'c6', name: 'SİNERJİ YÜKSEK TEKNOLOJİ Anonim Şirketi', email: 'info@sinerji.com', taxNo: '7710551723', taxOffice: 'IRMAK', address: 'FABRİKALAR MAHALLESİ SİLAH İHTİSAS OSB. 2.SOKAK NO:5 merkez Kırıkkale', city: 'Kırıkkale', district: 'Merkez', isLegalEntity: true },
  { id: 'c7', name: 'Volkan İtfaiye Araçları San. Tic. A.Ş', email: 'info@volkanitfaiye.com', taxNo: '9250501374', taxOffice: 'TORBALI', address: 'Yazıbaşı Mahallesi 9230/1 Sokak No: 17 Torbalı İzmir', city: 'İzmir', district: 'Torbalı', isLegalEntity: true },
  { id: 'c8', name: 'GÖKMEN MAKİNA SAN. VE TİC. LTD. ŞTİ.', email: 'info@gokmenmakina.com', taxNo: '7580013218', taxOffice: 'HASANTAHSİN V.D.', address: 'Kemalpaşa Mah. 7413 Sok. No : 4 Bornova, İzmir', city: 'İzmir', district: 'Bornova', isLegalEntity: true },
];

export const MOCK_DOCUMENTS: Document[] = [
  // Fatura 1: ANT TRAKTÖR
  {
    id: 'LT02025000000356',
    title: '173E',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[0],
    date: '2025-12-02',
    createdAt: '2025-12-02T10:00:00.000Z',
    paymentDueDate: '2025-12-16',
    currency: 'EUR',
    exchangeRate: 49.3595,
    items: [
      { productId: 'p1', sku: '173E.T1.10', productName: '173E Ø10 Sub Pens', quantity: 1, unit: 'Adet', unitPrice: 40, taxRate: 20, discount: 0, total: 40 }
    ],
    totalAmount: 48, // 40 + KDV
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT',
    eInvoiceNumber: 'GIB2025000000356'
  },
  // Fatura 2: GÖKMEN MAKİNA
  {
    id: 'LT02025000000353',
    title: 'SK40-SSF-8-160 X2',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[7],
    date: '2025-12-02',
    createdAt: '2025-12-02T11:00:00.000Z',
    paymentDueDate: '2025-12-02',
    currency: 'EUR',
    exchangeRate: 49.3595,
    items: [
      { productId: 'p21', sku: 'SK40-SSF-8-160', productName: 'Tezgah Takım Tutucusu (KESİCİ UÇ HARİÇ) {demirbaş}', quantity: 4, unit: 'Adet', unitPrice: 237, taxRate: 0, discount: 0, total: 948 }
    ],
    totalAmount: 948,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  },
  // Fatura 3: KPS AUTOMOTIVE
  {
    id: 'LT02025000000354',
    title: 'F25 Set',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[1],
    date: '2025-12-02',
    createdAt: '2025-12-02T12:00:00.000Z',
    paymentDueDate: '2026-01-01',
    currency: 'EUR',
    exchangeRate: 49.3595,
    items: [
      { productId: 'p2', sku: '145E.T1.08', productName: 'F25 Ø8 Kanalsız Pens', quantity: 1, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 30 },
      { productId: 'p3', sku: 'T223.A1.08', productName: 'T223 Ø8 Guide Bush Gisstec', quantity: 1, unit: 'Adet', unitPrice: 150, taxRate: 20, discount: 0, total: 150 },
      { productId: 'p4', sku: 'FM.09.08', productName: 'M9x1L Ø8 Sürücü Pens', quantity: 1, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 30 }
    ],
    totalAmount: 252,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  },
  // Fatura 4: SFSFIX
  {
    id: 'LT02025000000XXX', // ID wasn't clear in image, generated
    title: '(AÇIK SİPARİŞ) F20 Set',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[2],
    date: '2025-12-02',
    createdAt: '2025-12-02T13:00:00.000Z',
    paymentDueDate: '2025-12-02',
    currency: 'EUR',
    exchangeRate: 49.3595,
    items: [
      { productId: 'p5', sku: 'F605.T1.16,5', productName: 'F605 Ø16,5 Karbürsüz Guide Bush', quantity: 1, unit: 'Adet', unitPrice: 55, taxRate: 20, discount: 0, total: 55 },
      { productId: 'p6', sku: '138E.T1.16,5', productName: '138E F20 Ø16,5 Pens (Arkası Kamalı)', quantity: 1, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 30 },
      { productId: 'p7', sku: 'FM.08.16,5', productName: 'M8x0,75R Ø16,5 Sürücü Pens', quantity: 1, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 30 }
    ],
    totalAmount: 138,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  },
  // Fatura 5: ÖZIŞIK MAKİNA
  {
    id: 'LT02025000000YYY',
    title: 'AÇIK SİPARİŞ - PİMLİ SÜ...',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[3],
    date: '2025-12-02',
    createdAt: '2025-12-02T14:00:00.000Z',
    paymentDueDate: '2025-12-02',
    currency: 'EUR',
    exchangeRate: 49.3595,
    items: [
      { productId: 'p8', sku: 'FP.05.16', productName: "20'lik D20 P5x3 Ø16 Pimli Sürücü Pensi", quantity: 2, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 60 }
    ],
    totalAmount: 72,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  },
  // Fatura 6: NANOTECH
  {
    id: 'LT02025000000355',
    title: 'F25',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[4],
    date: '2025-12-02',
    createdAt: '2025-12-02T15:00:00.000Z',
    paymentDueDate: '2025-12-02',
    currency: 'EUR',
    exchangeRate: 49.3595,
    items: [
      { productId: 'p9', sku: '145E.T1.10.K', productName: '145E F25 Ø10 Main Pens', quantity: 1, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 30 },
      { productId: 'p10', sku: '145E.T1.04', productName: '145E F25 Ø4 Sub Pens', quantity: 1, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 30 },
      { productId: 'p11', sku: 'T223.T1.10', productName: 'T223 F25 Ø10 Guide Bush', quantity: 1, unit: 'Adet', unitPrice: 135, taxRate: 20, discount: 0, total: 135 },
      { productId: 'p12', sku: 'FM.09.10', productName: 'M9x1 Ø10 Sürücü Pensi', quantity: 1, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 30 },
      { productId: 'p13', sku: 'MA16', productName: 'ER16 Mini Anahtar', quantity: 1, unit: 'Adet', unitPrice: 6, taxRate: 20, discount: 0, total: 6 }
    ],
    totalAmount: 277.20,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  },
  // Fatura 7: SİNERJİ - ER40
  {
    id: 'LT02025000000350',
    title: 'ER40 Ø25',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[5],
    date: '2025-12-01',
    createdAt: '2025-12-01T10:00:00.000Z',
    paymentDueDate: '2025-12-01',
    currency: 'EUR',
    exchangeRate: 49.0997,
    items: [
      { productId: 'p14', sku: 'ER40.H.25', productName: 'ER40 Ø25 Ultra Hassas Pens', quantity: 30, unit: 'Adet', unitPrice: 14, taxRate: 20, discount: 0, total: 420 }
    ],
    totalAmount: 504,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  },
  // Fatura 8: SİNERJİ - BT40
  {
    id: 'LT02025000000351',
    title: 'BT40 - GT25',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[5],
    date: '2025-12-01',
    createdAt: '2025-12-01T11:00:00.000Z',
    paymentDueDate: '2025-12-01',
    currency: 'EUR',
    exchangeRate: 49.0997,
    items: [
      { productId: 'p15', sku: 'GT-25-BT40', productName: 'BT40 ER25 Ayarlanabilir Açılı Kafa Termin: STOKTA MEVCUT', quantity: 1, unit: 'Adet', unitPrice: 9050, taxRate: 20, discount: 0, total: 9050 }
    ],
    totalAmount: 10860,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  },
  // Fatura 9: SİNERJİ - AÇIK SİPARİŞ
  {
    id: 'LT02025000000ZZZ',
    title: 'AÇIK SİPARİŞ - F16',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[5],
    date: '2025-12-01',
    createdAt: '2025-12-01T12:00:00.000Z',
    paymentDueDate: '2025-12-01',
    currency: 'EUR',
    exchangeRate: 49.0997,
    items: [
      { productId: 'p16', sku: 'F391.T1.5,2', productName: 'F391 T16 Ø5,2 Guide Bush', quantity: 3, unit: 'Adet', unitPrice: 110, taxRate: 20, discount: 0, total: 330 },
      { productId: 'p17', sku: '1212E.T1.5,2', productName: '1212E F16 Ø5,2 Main Pens', quantity: 3, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 90 },
      { productId: 'p18', sku: '1212E.T1.5', productName: '1212E F16 Ø5 Sub Pens', quantity: 3, unit: 'Adet', unitPrice: 30, taxRate: 20, discount: 0, total: 90 },
      { productId: 'p19', sku: 'SPA.M9-M12-1,25', productName: 'M9x1-M12x1,25 Sürücü Pens Adaptörü', quantity: 5, unit: 'Adet', unitPrice: 137.50, taxRate: 20, discount: 0, total: 687.50 }
    ],
    totalAmount: 1437,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  },
  // Fatura 10: Volkan İtfaiye
  {
    id: 'LT02025000000352',
    title: 'Açık Sipariş Kama Ucu',
    type: DocType.INVOICE,
    customer: MOCK_CUSTOMERS[6],
    date: '2025-12-01',
    createdAt: '2025-12-01T13:00:00.000Z',
    paymentDueDate: '2025-09-26',
    currency: 'EUR',
    exchangeRate: 49.0997,
    items: [
      { productId: 'p20', sku: 'IN-10-H7/J59', productName: 'KAMA ELMASI, IN-10-H7 / J59, 10MM', quantity: 10, unit: 'Adet', unitPrice: 57, taxRate: 20, discount: 0, total: 570 }
    ],
    totalAmount: 684,
    status: Status.INVOICED,
    eInvoiceStatus: 'SENT'
  }
];
