
export enum Status {
  DRAFT = 'Taslak',
  PENDING = 'Beklemede',
  APPROVED = 'Onaylandı',
  SHIPPED = 'Sevk Edildi',
  PARTIAL = 'Kısmi Sevk',
  INVOICED = 'Faturalandı',
  PARTIAL_PAID = 'Kısmi Ödeme',
  PAID = 'Ödendi',
  CANCELLED = 'İptal',
  SUSPENDED = 'Askıda',
  REJECTED = 'Reddedildi'
}

export enum DocType {
  QUOTE = 'Teklif',
  ORDER = 'Sipariş',
  INVOICE = 'Fatura',
  WAYBILL = 'İrsaliye'
}

export enum ItemStatus {
  WAITING = 'Bekliyor',
  PREPARING = 'Hazırlanıyor',
  SHIPPED = 'Sevk Edildi',
  DELIVERED = 'Teslim Edildi'
}

export type Currency = 'TRY' | 'USD' | 'EUR';

// USER MANAGEMENT TYPES
export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'SALES' | 'STOCK';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    password?: string; 
    lastLogin?: string;
    isActive: boolean;
}

export interface CompanyInfo {
    id?: string;
    name: string; // Ticari Ünvan
    logoUrl?: string; // Logo (Base64 or URL)
    taxNo: string;
    taxOffice: string;
    mersisNo?: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
}

export interface EInvoiceIntegratorConfig {
    integrator: 'PARASUT' | 'UYUMSOFT' | 'LOGO' | 'GIB_PORTAL';
    username?: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
    isProduction: boolean; 
}

export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK';
  currency: Currency;
  balance: number;
  iban?: string;
  bankName?: string;
  branch?: string;
}

export interface Transaction {
    id: string;
    accountId: string;
    date: string;
    amount: number;
    type: 'PAYMENT' | 'COLLECTION' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';
    description: string;
    relatedId?: string;
    balanceAfter: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  currency: Currency;
  cost: number;
  category: string;
  lastRestockDate: string;
  trackStock?: boolean;
  unit?: string;
  vatRate?: number;
  barcode?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  taxNo: string;
  taxOffice?: string;
  address?: string;
  phone?: string;
  city?: string;
  district?: string;
  postCode?: string;
  isLegalEntity?: boolean;
}

export interface Check {
  id: string;
  checkNumber: string;
  bankName: string;
  drawer: string; // Keşideci
  amount: number;
  currency: Currency;
  issueDate: string;
  dueDate: string; // Vade
  status: 'PENDING' | 'COLLECTED' | 'BOUNCED' | 'RETURNED';
  customerId: string;
  description?: string;
  imageUrl?: string;
}

export interface Payment {
  id: string;
  customerId: string;
  docId?: string;
  accountId?: string; // Optional because Checks might not hit an account immediately
  checkId?: string; // Link to Check if method is CHECK
  date: string;
  amount: number;
  currency: Currency;
  exchangeRate: number;
  processingRate?: number;
  description?: string;
  type: 'COLLECTION';
  method: 'BANK' | 'CASH' | 'CHECK' | 'CHECK';
}

export interface Reconciliation {
  id: string;
  customerId: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  balance: number;
  status: 'AGREED' | 'NOT_AGREED';
  note?: string;
  createdAt: string;
}

export interface LineItem {
  id?: string;
  productId: string;
  productName: string;
  sku?: string;
  description?: string;
  deliveryNote?: string;
  quantity: number;
  unit?: string;
  shippedQuantity?: number;
  deliveryDate?: string;
  balanceDeadline?: string;
  itemStatus?: ItemStatus;
  unitPrice: number;
  taxRate: number;
  discount: number;
  total: number;
}

export interface Document {
  id: string;
  title?: string;
  type: DocType;
  customer: Customer;
  date: string;
  createdAt?: string;
  paymentDueDate?: string; 
  items: LineItem[];
  totalAmount: number;
  currency: Currency;
  exchangeRate?: number;
  status: Status;
  relatedDocId?: string;
  notes?: string;
  terms?: string;
  eInvoiceStatus?: 'DRAFT' | 'QUEUED' | 'SENT' | 'ERROR';
  eInvoiceNumber?: string;
  eInvoiceETTN?: string;
}

export interface SalesMetrics {
  totalRevenue: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  monthlySales: { name: string; value: number }[];
}
