
import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { User, UserRole } from '../types';
import { Users, Plus, Pencil, Trash2, Search, X, Check, Shield, Lock } from 'lucide-react';

const UsersPage = () => {
  const { users, addUser, updateUser, deleteUser } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
      name: '',
      email: '',
      role: 'SALES',
      isActive: true,
      password: ''
  });

  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (user?: User) => {
      if (user) {
          setEditingUser(user);
          setFormData({ ...user, password: '' }); // Don't show password
      } else {
          setEditingUser(null);
          setFormData({ name: '', email: '', role: 'SALES', isActive: true, password: '' });
      }
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!formData.name || !formData.email) {
          alert('Ad Soyad ve E-posta zorunludur.');
          return;
      }

      if (!editingUser && !formData.password) {
          alert('Yeni kullanıcı için parola zorunludur.');
          return;
      }

      const userData: User = {
          id: editingUser ? editingUser.id : `USER-${Date.now()}`,
          name: formData.name!,
          email: formData.email!,
          role: formData.role || 'SALES',
          isActive: formData.isActive ?? true,
          password: formData.password, // In a real app, hash this!
          lastLogin: editingUser ? editingUser.lastLogin : undefined
      };

      if (editingUser) {
          updateUser(userData);
      } else {
          addUser(userData);
      }
      setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
          deleteUser(id);
      }
  };

  const getRoleBadge = (role: UserRole) => {
      switch(role) {
          case 'ADMIN': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">Yönetici</span>;
          case 'ACCOUNTANT': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Muhasebe</span>;
          case 'SALES': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Satış</span>;
          case 'STOCK': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">Stok/Depo</span>;
          default: return null;
      }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-blue-600" />
                    Kullanıcı Yönetimi
                </h2>
                <p className="text-slate-500">Sistem kullanıcılarını ve yetkilerini yönetin</p>
            </div>
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
            >
                <Plus size={18} /> Yeni Kullanıcı Ekle
            </button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-4 items-center bg-white p-2 rounded-lg border border-slate-200 w-full md:w-1/3">
            <Search className="text-gray-400 w-4 h-4 ml-2" />
            <input 
                type="text" 
                placeholder="Kullanıcı ara..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 text-gray-700" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Ad Soyad</th>
                        <th className="px-6 py-4">E-Posta</th>
                        <th className="px-6 py-4">Yetki / Rol</th>
                        <th className="px-6 py-4">Durum</th>
                        <th className="px-6 py-4">Son Giriş</th>
                        <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{user.name}</td>
                            <td className="px-6 py-4 text-slate-600">{user.email}</td>
                            <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {user.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString('tr-TR') : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Shield size={20} className="text-blue-600" />
                            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ad Soyad *</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 placeholder-gray-500" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-Posta *</label>
                            <input 
                                type="email" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 placeholder-gray-500" 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Yetki / Rol</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                            >
                                <option value="SALES">Satış Personeli</option>
                                <option value="ACCOUNTANT">Muhasebe</option>
                                <option value="STOCK">Stok / Depo</option>
                                <option value="ADMIN">Yönetici (Admin)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                <Lock size={12} /> Parola {editingUser && '(Değiştirmek için girin)'}
                            </label>
                            <input 
                                type="password" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 placeholder-gray-500" 
                                placeholder={editingUser ? "Değiştirmek için yeni parola..." : "Parola belirleyin..."}
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="isActive"
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={formData.isActive}
                                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                            />
                            <label htmlFor="isActive" className="text-sm text-slate-700">Kullanıcı Aktif</label>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">İptal</button>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2">
                            <Check size={18} /> Kaydet
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UsersPage;
