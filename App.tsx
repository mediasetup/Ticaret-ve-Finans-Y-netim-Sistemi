
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StockManagement from './pages/StockManagement';
import WaybillList from './pages/WaybillList';
import WaybillEditor from './pages/WaybillEditor';
import SalesWorkflow from './pages/SalesWorkflow';
import Reports from './pages/Reports';
import QuoteEditor from './pages/QuoteEditor';
import OrderEditor from './pages/OrderEditor';
import QuoteDetail from './pages/QuoteDetail';
import OrderDetail from './pages/OrderDetail';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import ReconciliationPage from './pages/Reconciliation';
import BankAccounts from './pages/BankAccounts';
import CheckList from './pages/CheckList';
import EInvoiceSettings from './pages/EInvoiceSettings';
import UsersPage from './pages/Users';
import CompanySettings from './pages/CompanySettings';
import Login from './pages/Login';
import { SalesProvider, useSales } from './context/SalesContext';
import InvoiceDetail from './pages/InvoiceDetail';
import { Loader2 } from 'lucide-react';

const ProtectedRoutes = () => {
    const { currentUser, loading } = useSales();
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }
    
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    
    return (
        <Layout>
            <Outlet />
        </Layout>
    );
};


function App() {
  return (
    <SalesProvider>
      <Router>
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoutes />}>
                <Route path="/" element={<Dashboard />} />
                
                {/* Inventory Routes */}
                <Route path="/stock" element={<Navigate to="/inventory/products" replace />} />
                <Route path="/inventory/products" element={<StockManagement />} />
                <Route path="/inventory/waybills" element={<WaybillList />} />
                <Route path="/inventory/waybill/new" element={<WaybillEditor />} />
                <Route path="/inventory/waybill/:id" element={<WaybillEditor />} />
                
                <Route path="/sales" element={<Navigate to="/sales/quotes" replace />} />

                <Route path="/sales/quotes" element={<SalesWorkflow />} />
                <Route path="/sales/orders" element={<SalesWorkflow />} />
                <Route path="/sales/invoices" element={<SalesWorkflow />} />
                
                <Route path="/sales/customers" element={<CustomerList />} />
                <Route path="/sales/customers/:id" element={<CustomerDetail />} />
                
                <Route path="/accounting/banks" element={<BankAccounts />} />
                <Route path="/accounting/checks" element={<CheckList />} />
                <Route path="/sales/reconciliation" element={<ReconciliationPage />} />
                
                <Route path="/settings/company" element={<CompanySettings />} />
                <Route path="/settings/users" element={<UsersPage />} />
                <Route path="/einvoice/settings" element={<EInvoiceSettings />} />

                <Route path="/sales/quote/new" element={<QuoteEditor />} />
                <Route path="/sales/quote/:id" element={<QuoteEditor />} />
                <Route path="/sales/quote/view/:id" element={<QuoteDetail />} />
                
                <Route path="/sales/order/new" element={<OrderEditor />} />
                <Route path="/sales/order/edit/:id" element={<OrderEditor />} />
                <Route path="/sales/order/:id" element={<OrderDetail />} />
                
                <Route path="/sales/invoice/:id" element={<InvoiceDetail />} /> 
                
                <Route path="/reports" element={<Reports />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
      </Router>
    </SalesProvider>
  );
}

export default App;
