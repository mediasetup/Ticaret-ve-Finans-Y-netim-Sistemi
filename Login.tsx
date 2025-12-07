
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSales } from '../context/SalesContext';
import { Wallet, LogIn, Loader2, Check } from 'lucide-react';

const Login = () => {
    const { login, currentUser, companyInfo } = useSales();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Reactive Redirect: Kullanıcı oturumu context üzerinde yüklendiğinde
    // bileşen yeniden render olur ve bu blok çalışarak otomatik yönlendirme yapar.
    if (currentUser) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const { success, error: authError } = await login(email, password);
        
        if (success) {
            // Oturum başarılı. Context currentUser'ı güncellediğinde otomatik yönlendirme çalışacak.
        } else {
            setLoading(false);
            setError(authError || 'Geçersiz e-posta veya parola.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        {companyInfo?.logoUrl ? (
                             <img src={companyInfo.logoUrl} alt="Logo" className="h-12 object-contain" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Wallet className="w-10 h-10 text-blue-600" />
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">{companyInfo?.name || 'KOBİ Sys'}</h1>
                                </div>
                            </div>
                        )}
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-slate-900">
                        Yönetim Paneline Giriş Yapın
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Lütfen devam etmek için bilgilerinizi girin.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">E-posta Adresi</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="username" // Browser autocomplete için kritik
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="E-posta Adresi"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">Parola</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                autoComplete="current-password" // Browser password manager için kritik
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Parola"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer select-none">
                                Beni Hatırla
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#" className="font-medium text-blue-600 hover:text-blue-500" onClick={(e) => { e.preventDefault(); alert("Lütfen sistem yöneticinizle iletişime geçin."); }}>
                                Şifremi unuttum?
                            </a>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                {loading ? <Loader2 className="h-5 w-5 text-blue-300 animate-spin" /> : <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />}
                            </span>
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
