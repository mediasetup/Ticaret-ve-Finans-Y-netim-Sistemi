
import React, { useState, useEffect } from 'react';
import { Save, Building, Image as ImageIcon, Upload } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { CompanyInfo } from '../types';

const CompanySettings = () => {
    const { companyInfo, updateCompanyInfo } = useSales();
    const [form, setForm] = useState<CompanyInfo>({
        name: '', taxNo: '', taxOffice: '', address: '', phone: '', email: '', logoUrl: ''
    });

    useEffect(() => {
        if (companyInfo) {
            setForm(companyInfo);
        }
    }, [companyInfo]);

    const handleSave = async () => {
        await updateCompanyInfo(form);
        alert("Firma bilgileri başarıyla güncellendi.");
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm({...form, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                    <Building size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Firma Bilgileri</h2>
                    <p className="text-slate-500">Belgelerde ve yasal bildirimlerde kullanılacak bilgileri yönetin.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                    {/* Logo Section */}
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-slate-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                            {form.logoUrl ? (
                                <img src={form.logoUrl} alt="Firma Logosu" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <ImageIcon className="text-gray-400" size={32} />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Firma Logosu</h3>
                            <p className="text-sm text-slate-500 mb-2">Belgelerinize otomatik eklenecektir.</p>
                            <label className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                                <Upload size={16}/> Logo Yükle
                                <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoUpload} />
                            </label>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-slate-700 mb-4">Yasal Bilgiler</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ticari Ünvan</label>
                                <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adres</label>
                                <textarea name="address" value={form.address} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vergi Dairesi</label>
                                <input type="text" name="taxOffice" value={form.taxOffice} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vergi Numarası</label>
                                <input type="text" name="taxNo" value={form.taxNo} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mersis No</label>
                                <input type="text" name="mersisNo" value={form.mersisNo || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>

                     <div className="border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-slate-700 mb-4">İletişim Bilgileri</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label>
                                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-Posta</label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Web Sitesi</label>
                                <input type="text" name="website" value={form.website || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors"
                    >
                        <Save size={20} />
                        Bilgileri Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanySettings;
