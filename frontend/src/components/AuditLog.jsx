import React, { useState, useEffect } from 'react';
import { History, Search, Loader, Filter, Clock, User, Activity } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('gebas_token');
                const response = await axios.get(`${API}/api/audit-logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setLogs(response.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'فشل جلب سجلات النظام');
                if (err.response?.status === 403) {
                    setError('عذراً، هذه الصفحة مخصصة لمدير النظام فقط للرقابة.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        (log.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (log.details?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (log.action?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'UPDATE': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'LOGIN': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'CREATE': return '➕ إضافة';
            case 'UPDATE': return '✏️ تعديل';
            case 'DELETE': return '🗑️ حذف';
            case 'LOGIN': return '🔐 دخول';
            default: return '⚙️ عملية';
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans text-right" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 gap-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-gray-900 text-white rounded-xl shadow-md">
                            <History size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">سجل مراقبة النظام (Audit Logs)</h1>
                            <p className="text-sm text-gray-500 mt-1">تتبع جميع عمليات الإضافة، التعديل والحذف التي تمت بواسطة المستخدمين</p>
                        </div>
                    </div>

                    <div className="flex bg-gray-50 p-2 rounded-xl border border-gray-200 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="بحث في السجل..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-sans"
                            />
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl font-medium flex items-center gap-3">
                        <ShieldAlert size={20} />
                        {error}
                    </div>
                )}

                {/* Logs Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-2"><Clock size={16} />الوقت والتاريخ</div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-2"><User size={16} />المستخدم</div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-2"><Activity size={16} />العملية (النوع)</div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-2"><Filter size={16} />التفاصيل (القسم)</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 font-medium">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-16">
                                            <Loader className="animate-spin text-gray-900 mx-auto mb-4" size={32} />
                                            <p className="text-gray-500 font-bold">جاري إحضار السجلات بدقة...</p>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-gray-400 font-bold">
                                            لا توجد سجلات مطابقة للعرض
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" dir="ltr">
                                                <div className="font-mono text-right bg-gray-100 inline-block px-3 py-1 rounded text-gray-600 font-bold">
                                                    {log.timestamp}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                                                        {(log.username || 'SYS').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-gray-800" dir="ltr">{log.username || 'System'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold rounded-lg border ${getActionColor(log.action)}`}>
                                                    {getActionIcon(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-800 font-bold">{log.details}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-mono">Table: {log.table_name}</span>
                                                    {log.record_id && <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-mono">ID: {log.record_id}</span>}
                                                </div>
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
    );
};

export default AuditLog;
