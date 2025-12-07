
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Document, Customer, Product, Payment, Account, Category, Reconciliation, Transaction, EInvoiceIntegratorConfig, User, CompanyInfo, Check } from '../types';
import { supabase, supabaseUrl, supabaseKey } from '../services/supabase';
import { fetchTCMBRates, ExchangeRates } from '../services/tcmb';
import { createClient } from '@supabase/supabase-js';

interface SalesContextType {
  documents: Document[];
  customers: Customer[];
  products: Product[];
  payments: Payment[];
  accounts: Account[];
  transactions: Transaction[]; 
  categories: Category[];
  checks: Check[];
  reconciliations: Reconciliation[];
  einvoiceConfig: EInvoiceIntegratorConfig | null;
  users: User[]; 
  companyInfo: CompanyInfo | null; 
  currentRates: ExchangeRates | null;
  ratesLoading: boolean;
  ratesError: string | null;
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  addDocument: (doc: Document) => Promise<Document | null>;
  updateDocument: (doc: Document) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<Customer | null>;
  addProduct: (product: Product) => Promise<Product | null>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<boolean>; 
  deleteCustomer: (id: string) => Promise<boolean>;
  addPayment: (payment: Payment) => Promise<void>;
  updatePayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  getDocument: (id: string) => Document | undefined;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addReconciliation: (rec: Reconciliation) => Promise<void>;
  updateReconciliation: (rec: Reconciliation) => Promise<void>;
  deleteReconciliation: (id: string) => Promise<void>;
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<boolean>;
  addTransaction: (tx: Transaction) => Promise<void>;
  transferFunds: (fromAccId: string, toAccId: string, amount: number, description: string) => Promise<void>;
  updateEInvoiceConfig: (config: EInvoiceIntegratorConfig) => Promise<void>;
  addUser: (user: User) => Promise<void>; 
  updateUser: (user: User) => Promise<void>; 
  deleteUser: (id: string) => Promise<void>; 
  updateCompanyInfo: (info: CompanyInfo) => Promise<void>; 
  addCheck: (check: Check) => Promise<void>;
  updateCheck: (check: Check) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  refreshRates: () => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [einvoiceConfig, setEinvoiceConfig] = useState<EInvoiceIntegratorConfig | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentRates, setCurrentRates] = useState<ExchangeRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const clearAllData = () => {
      setDocuments([]);
      setCustomers([]);
      setProducts([]);
      setPayments([]);
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
      setReconciliations([]);
      setChecks([]);
      setUsers([]);
      setCompanyInfo(null);
      setEinvoiceConfig(null);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
        const [
            docsRes, custRes, prodRes, payRes, accRes, catRes, recRes, einvRes, profilesRes, compRes, txRes, checksRes
        ] = await Promise.all([
            supabase.from('documents').select('*'),
            supabase.from('customers').select('*'),
            supabase.from('products').select('*'),
            supabase.from('payments').select('*'),
            supabase.from('accounts').select('*'),
            supabase.from('categories').select('*'),
            supabase.from('reconciliations').select('*'),
            supabase.from('einvoice_config').select('*').limit(1),
            supabase.from('profiles').select('*'),
            supabase.from('company_info').select('*').limit(1),
            supabase.from('transactions').select('*'),
            supabase.from('checks').select('*'),
        ]);

        if (docsRes.data) setDocuments(docsRes.data);
        if (custRes.data) setCustomers(custRes.data);
        if (prodRes.data) setProducts(prodRes.data);
        if (payRes.data) setPayments(payRes.data);
        if (accRes.data) setAccounts(accRes.data);
        if (catRes.data) setCategories(catRes.data);
        if (recRes.data) setReconciliations(recRes.data);
        if (checksRes.data) {
             const mappedChecks: Check[] = checksRes.data.map((c: any) => ({
                 id: c.id,
                 checkNumber: c.check_number,
                 bankName: c.bank_name,
                 drawer: c.drawer,
                 amount: c.amount,
                 currency: c.currency,
                 issueDate: c.issue_date,
                 dueDate: c.due_date,
                 status: c.status,
                 customerId: c.customer_id,
                 description: c.description
             }));
             setChecks(mappedChecks);
        }
        if (einvRes.data?.[0]) setEinvoiceConfig(einvRes.data[0]);
        if (compRes.data?.[0]) setCompanyInfo(compRes.data[0]);
        if (txRes.data) setTransactions(txRes.data);

        // Map Profiles to Users
        if (profilesRes.data) {
            const mappedUsers: User[] = profilesRes.data.map(p => ({
                id: p.id,
                name: p.full_name || p.email?.split('@')[0] || 'İsimsiz',
                email: p.email || '',
                role: p.role || 'SALES',
                isActive: true,
                lastLogin: p.created_at
            }));
            setUsers(mappedUsers);
        }
        
    } catch (error) {
        console.error("Error fetching initial data:", error);
    } finally {
        setLoading(false);
    }
  };

  const findUserProfile = async (userId: string, email?: string): Promise<User | null> => {
      let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (!profile && email) {
          const { data: profileByEmail } = await supabase.from('profiles').select('*').eq('email', email).single();
          profile = profileByEmail;
      }

      if (profile) {
          return {
              id: profile.id,
              name: profile.full_name || profile.name || email?.split('@')[0] || 'Kullanıcı',
              email: profile.email || email || '',
              role: profile.role || 'SALES',
              isActive: true,
              lastLogin: new Date().toISOString()
          };
      }

      let { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!user && email) {
          const { data: userByEmail } = await supabase.from('users').select('*').eq('email', email).single();
          user = userByEmail;
      }

      return user as User | null;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await findUserProfile(session.user.id, session.user.email);
        setCurrentUser(userProfile || null);

        if (userProfile) {
            await fetchInitialData();
        }
      } else {
        setCurrentUser(null);
        clearAllData();
      }
      setLoading(false);
    });
  
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
      }
    };
    checkSession();
  
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
      if (error) return { success: false, error: error.message };

      if (data.user) {
         const profile = await findUserProfile(data.user.id, data.user.email);
         if (!profile) {
             await supabase.auth.signOut();
             return { success: false, error: 'Bu e-posta adresi için tanımlı bir kullanıcı profili bulunamadı.' };
         }
      }

      return { success: true };
  };

  const logout = async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
      clearAllData();
  };
  
  // --- ASYNC CRUD FUNCTIONS ---

  const addDocument = async (doc: Document) => {
    const { data, error } = await supabase.from('documents').insert(doc).select().single();
    if (error) { console.error(error); return null; }
    if (data) setDocuments(prev => [data, ...prev]);
    return data;
  };
  
  const updateDocument = async (doc: Document) => {
    const { data, error } = await supabase.from('documents').update(doc).eq('id', doc.id).select().single();
    if (error) { console.error(error); return null; }
    if (data) setDocuments(prev => prev.map(d => d.id === data.id ? data : d));
    return data;
  };

  const deleteDocument = async (id: string) => {
      await supabase.from('documents').delete().eq('id', id);
      setDocuments(prev => prev.filter(d => d.id !== id));
  };
  
  const addCustomer = async (customer: Customer) => {
    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) { console.error(error); return null; }
    if (data) setCustomers(prev => [...prev, data]);
    return data;
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
      await supabase.from('customers').update(customerData).eq('id', id);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...customerData } as Customer : c));
  };
  
  const addProduct = async (product: Product) => {
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) { console.error(error); return null; }
    if (data) setProducts(prev => [...prev, data]);
    return data;
  };
  
  const updateProduct = async (product: Product) => {
     const { data, error } = await supabase.from('products').update(product).eq('id', product.id).select().single();
     if (error) { console.error(error); return; }
     if (data) setProducts(prev => prev.map(p => p.id === data.id ? data : p));
  };

  const deleteProduct = async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) { console.error(error); return false; }
      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
  };

  const deleteCustomer = async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) { console.error(error); return false; }
      setCustomers(prev => prev.filter(c => c.id !== id));
      return true;
  };

  const addPayment = async (payment: Payment) => {
      const { data, error } = await supabase.from('payments').insert(payment).select().single();
      if (error) { console.error(error); return; }
      if (data) setPayments(prev => [...prev, data]);
  };

  const updatePayment = async (payment: Payment) => {
      const { data, error } = await supabase.from('payments').update(payment).eq('id', payment.id).select().single();
      if (error) { console.error(error); return; }
      if (data) setPayments(prev => prev.map(p => p.id === data.id ? data : p));
  };

  const deletePayment = async (id: string) => {
      await supabase.from('payments').delete().eq('id', id);
      setPayments(prev => prev.filter(p => p.id !== id));
  };

  const getDocument = (id: string) => documents.find((doc) => doc.id === id);
  
  const addCategory = async (category: Category) => {
      const { data, error } = await supabase.from('categories').insert(category).select().single();
      if (data) setCategories(prev => [...prev, data]);
  };
  
  const updateCategory = async (category: Category) => {
      const { data, error } = await supabase.from('categories').update(category).eq('id', category.id).select().single();
      if (data) setCategories(prev => prev.map(c => c.id === data.id ? data : c));
  };
  
  const deleteCategory = async (id: string) => {
      await supabase.from('categories').delete().eq('id', id);
      setCategories(prev => prev.filter(c => c.id !== id));
  };
  
  const addReconciliation = async (rec: Reconciliation) => {
      const { data } = await supabase.from('reconciliations').insert(rec).select().single();
      if (data) setReconciliations(prev => [...prev, data]);
  };
  
  const updateReconciliation = async (rec: Reconciliation) => {
      const { data } = await supabase.from('reconciliations').update(rec).eq('id', rec.id).select().single();
      if (data) setReconciliations(prev => prev.map(r => r.id === data.id ? data : r));
  };
  
  const deleteReconciliation = async (id: string) => {
      await supabase.from('reconciliations').delete().eq('id', id);
      setReconciliations(prev => prev.filter(r => r.id !== id));
  };
  
  const addAccount = async (account: Account) => {
      const { data } = await supabase.from('accounts').insert(account).select().single();
      if (data) setAccounts(prev => [...prev, data]);
  };
  
  const updateAccount = async (account: Account) => {
      const { data } = await supabase.from('accounts').update(account).eq('id', account.id).select().single();
      if (data) setAccounts(prev => prev.map(a => a.id === data.id ? data : a));
  };
  
  const deleteAccount = async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) return false;
      setAccounts(prev => prev.filter(a => a.id !== id));
      return true;
  };
  
  const addTransaction = async (tx: Transaction) => {
      const { data } = await supabase.from('transactions').insert(tx).select().single();
      if (data) {
          setTransactions(prev => [...prev, data]);
          const { data: acc } = await supabase.from('accounts').select('*').eq('id', tx.accountId).single();
          if (acc) setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
      }
  };
  
  const transferFunds = async (fromAccId: string, toAccId: string, amount: number, description: string) => {
      const date = new Date().toISOString().split('T')[0];
      const fromTx = { id: `TX-${Date.now()}-1`, accountId: fromAccId, date, amount: -amount, type: 'TRANSFER' as const, description: `Transfer: ${description}`, balanceAfter: 0 };
      const toTx = { id: `TX-${Date.now()}-2`, accountId: toAccId, date, amount: amount, type: 'TRANSFER' as const, description: `Transfer: ${description}`, balanceAfter: 0 };
      await addTransaction(fromTx as any);
      await addTransaction(toTx as any);
  };
  
  const updateEInvoiceConfig = async (config: EInvoiceIntegratorConfig) => {
      const { data } = await supabase.from('einvoice_config').upsert(config).select().single();
      if (data) setEinvoiceConfig(data);
  };
  
  // CHECK CRUD
  const addCheck = async (check: Check) => {
     // Transform to snake_case for Supabase
     const payload = {
         id: check.id,
         check_number: check.checkNumber,
         bank_name: check.bankName,
         drawer: check.drawer,
         amount: check.amount,
         currency: check.currency,
         issue_date: check.issueDate,
         due_date: check.dueDate,
         status: check.status,
         customer_id: check.customerId,
         description: check.description
     };
     const { data, error } = await supabase.from('checks').insert(payload).select().single();
     if (error) { console.error(error); return; }
     if (data) {
         setChecks(prev => [...prev, check]);
     }
  };

  const updateCheck = async (check: Check) => {
     const payload = {
         check_number: check.checkNumber,
         bank_name: check.bankName,
         drawer: check.drawer,
         amount: check.amount,
         currency: check.currency,
         issue_date: check.issueDate,
         due_date: check.dueDate,
         status: check.status,
         customer_id: check.customerId,
         description: check.description
     };
     const { data, error } = await supabase.from('checks').update(payload).eq('id', check.id).select().single();
     if (error) { console.error(error); return; }
     if (data) {
         setChecks(prev => prev.map(c => c.id === check.id ? check : c));
     }
  };

  const deleteCheck = async (id: string) => {
      await supabase.from('checks').delete().eq('id', id);
      setChecks(prev => prev.filter(c => c.id !== id));
  };

  // --- USER MANAGEMENT (AUTH + PROFILES) ---

  const addUser = async (user: User) => {
      const tempSupabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
      });

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email: user.email,
          password: user.password || '123456',
          options: {
              data: {
                  full_name: user.name,
                  role: user.role
              }
          }
      });

      if (authError) {
          console.error("Auth Error:", authError);
          alert(`Kullanıcı oluşturulamadı: ${authError.message}`);
          return;
      }

      if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
              id: authData.user.id,
              email: user.email,
              full_name: user.name,
              role: user.role
          });

          if (profileError) {
             console.error("Profile Error:", profileError);
          } else {
             const newUser = { ...user, id: authData.user.id, password: '' };
             setUsers(prev => [...prev, newUser]);
          }
      }
  };
  
  const updateUser = async (user: User) => {
      const { data, error } = await supabase.from('profiles').update({
          full_name: user.name,
          role: user.role,
      }).eq('id', user.id).select().single();

      if (error) {
          console.error(error);
          alert("Güncelleme başarısız.");
      } else {
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, name: user.name, role: user.role } : u));
      }

      if (user.password) {
          alert("Bilgi: Kullanıcı profil detayları güncellendi. Ancak güvenlik kısıtlamaları nedeniyle, kullanıcı parolası sadece kullanıcı tarafından 'Şifremi Unuttum' ekranından değiştirilebilir.");
      }
  };
  
  const deleteUser = async (id: string) => {
      await supabase.from('profiles').delete().eq('id', id);
      setUsers(prev => prev.filter(u => u.id !== id));
      alert("Kullanıcı profili silindi. (Tam erişimi kaldırmak için Supabase panelinden Auth kullanıcısını da silmeniz gerekebilir).");
  };
  
  const updateCompanyInfo = async (info: CompanyInfo) => {
    if (info.id) {
        const { id, ...updateData } = info;
        const { error } = await supabase.from('company_info').update(updateData).eq('id', info.id);
        if (!error) setCompanyInfo(info);
    } else {
        const { id, ...insertData } = info;
        const { data } = await supabase.from('company_info').insert(insertData).select().single();
        if (data) setCompanyInfo(data as CompanyInfo);
    }
  };
  
  const refreshRates = async () => {
       setRatesLoading(true);
       try {
           const rates = await fetchTCMBRates();
           setCurrentRates(rates);
           setRatesError(null);
       } catch (err) {
           setRatesError("Kurlar alınamadı");
       } finally {
           setRatesLoading(false);
       }
  };

  useEffect(() => { refreshRates(); }, []);

  return (
    <SalesContext.Provider
      value={{
        documents, customers, products, payments, accounts, transactions, categories, reconciliations, checks, einvoiceConfig, users, companyInfo,
        currentRates, ratesLoading, ratesError, refreshRates, currentUser, loading, login, logout,
        addDocument, updateDocument, deleteDocument, addCustomer, addProduct, updateProduct, deleteProduct, deleteCustomer,
        updateCustomer, addPayment, updatePayment, deletePayment, getDocument, addCategory, updateCategory, deleteCategory,
        addReconciliation, updateReconciliation, deleteReconciliation, addAccount, updateAccount, deleteAccount,
        addTransaction, transferFunds, updateEInvoiceConfig, addUser, updateUser, deleteUser, updateCompanyInfo,
        addCheck, updateCheck, deleteCheck
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
