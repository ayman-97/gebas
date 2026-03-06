import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Key, Shield, ShieldAlert, Loader } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // New user form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('accountant'); // or 'admin'

    const fetchUsers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('gebas_token');
            const response = await axios.get(`${API}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'فشل جلب قائمة المستخدمين');
            if (err.response?.status === 403) {
                setError('عذراً، هذه الصفحة مخصصة لمدير النظام فقط.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('gebas_token');
            const response = await axios.post(`${API}/api/users`, {
                username,
                password,
                role
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSuccess(`تم إضافة المستخدم ${response.data.username} بنجاح`);
            setUsername('');
            setPassword('');
            setRole('accountant');
            fetchUsers();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'حدث خطأ أثناء إضافة المستخدم');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`هل أنت متأكد من حذف حساب (${username}) نهائياً؟`)) return;

        try {
            const token = localStorage.getItem('gebas_token');
            await axios.delete(`${API}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSuccess('تم حذف المستخدم بنجاح');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'لا يمكن حذف حسابك المستخدم حالياً أو حدث خطأ');
        }
    };

    // Determine current user to prevent self-deletion
    const currentUser = JSON.parse(localStorage.getItem('gebas_user') || '{}');

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans text-right" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">إدارة الصلاحيات والمستخدمين</h1>
                            <p className="text-sm text-gray-500 mt-1">إضافة محاسبين جدد أو مدراء ومنحهم الدخول للنظام</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl font-medium animate-pulse">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl font-medium">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add User Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 font-bold text-gray-700 flex items-center gap-2">
                                <UserPlus size={20} className="text-indigo-500" />
                                إضافة مستخدم جديد
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المستخدم (للدخول)</label>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                                        dir="ltr"
                                        placeholder="مثال: ahmad_acc"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">يُفضل باللغة الإنجليزية وبدون مسافات</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                                        dir="ltr"
                                        minLength="6"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">نوع الصلاحية (الدور)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRole('accountant')}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'accountant' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <Users size={24} />
                                            <span className="font-bold text-sm">محاسب (قياسي)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('admin')}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'admin' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <Shield size={24} />
                                            <span className="font-bold text-sm">مدير (مشرف مستقل)</span>
                                        </button>
                                        {currentUser?.role === 'super_admin' && (
                                            <button
                                                type="button"
                                                onClick={() => setRole('super_admin')}
                                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'super_admin' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <ShieldAlert size={24} />
                                                <span className="font-bold text-sm">مدير خارق (عام)</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader className="animate-spin" size={20} /> : 'إنشاء الحساب'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 font-bold text-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Key size={20} className="text-emerald-500" />
                                    الحسابات المسجلة
                                </div>
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                                    {users.length} مستخدمين
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-500 uppercase">اسم المستخدم</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500 uppercase">الصلاحية</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500 uppercase">الحالة</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500 uppercase">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-12">
                                                    <Loader className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
                                                    <p className="text-gray-500">جاري تحميل المستخدمين...</p>
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-8 text-gray-500">لا يوجد مستخدمين لعرضهم</td></tr>
                                        ) : (
                                            users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${user.role === 'admin' ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="font-bold text-gray-800" dir="ltr">{user.username}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {user.role === 'super_admin' ? (
                                                            <span className="inline-flex flex-col items-center text-purple-600 bg-purple-50 px-3 py-1 rounded-lg text-sm font-bold border border-purple-100">
                                                                <ShieldAlert size={14} className="mb-0.5" />
                                                                مدير خارق
                                                            </span>
                                                        ) : user.role === 'admin' ? (
                                                            <span className="inline-flex flex-col items-center text-rose-600 bg-rose-50 px-3 py-1 rounded-lg text-sm font-bold border border-rose-100">
                                                                <Shield size={14} className="mb-0.5" />
                                                                مدير نظام
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex flex-col items-center text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm font-bold border border-indigo-100">
                                                                <Users size={14} className="mb-0.5" />
                                                                محاسب
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            نشط
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {currentUser.username === user.username ? (
                                                            <span className="text-gray-400 text-sm italic">حسابك الحالي</span>
                                                        ) : user.username === 'admin' ? (
                                                            <span className="text-gray-400 text-sm font-bold" title="هذا هو الحساب الأساسي للنظام، لا يمكن حذفه أبداً">أساسي (محمي)</span>
                                                        ) : (currentUser.role === 'admin' && (user.role === 'admin' || user.role === 'super_admin')) ? (
                                                            <span className="text-gray-400 text-sm italic" title="لا تملك الصلاحية لحذفه">غير مُصرَّح</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id, user.username)}
                                                                className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors inline-block"
                                                                title="حذف المستخدم"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UsersManagement;
