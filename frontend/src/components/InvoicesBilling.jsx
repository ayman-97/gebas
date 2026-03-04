import React, { useState, useEffect } from 'react';
import { FileText, PlusCircle, Settings, RefreshCw, AlertCircle, Edit2, Trash2, X, Check, Search, Filter } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const MONTH_NAMES = [
    '', 'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
];

const InvoicesBilling = () => {
    // --- Pricing State ---
    const [pricings, setPricings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ month: '', year: '', price_per_ampere: '' });
    const [addForm, setAddForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), price_per_ampere: '' });

    // --- Invoices State ---
    const [invoices, setInvoices] = useState([]);
    const [isInvLoading, setIsInvLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [editingInvId, setEditingInvId] = useState(null);
    const [invEditForm, setInvEditForm] = useState({ total_required: '', paid_amount: '' });

    // --- Tab ---
    const [activeTab, setActiveTab] = useState('pricing'); // 'pricing' | 'invoices'

    // --- Fetch ---
    const fetchPricings = async () => {
        setIsLoading(true);
        try { setPricings((await axios.get(`${API}/api/pricing`)).data); }
        catch { setPricings([]); }
        finally { setIsLoading(false); }
    };

    const fetchInvoices = async () => {
        setIsInvLoading(true);
        try { setInvoices((await axios.get(`${API}/api/invoices`)).data); }
        catch { setInvoices([]); }
        finally { setIsInvLoading(false); }
    };

    useEffect(() => { fetchPricings(); fetchInvoices(); }, []);

    const formatCurrency = (amount) => (amount || 0).toLocaleString() + ' د.ع';

    // --- Pricing Actions ---
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/api/pricing`, { month: parseInt(addForm.month), year: parseInt(addForm.year), price_per_ampere: parseFloat(addForm.price_per_ampere) });
            fetchPricings(); setIsAddModalOpen(false); setAddForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), price_per_ampere: '' });
        } catch (error) { alert(error.response?.data?.detail || "حدث خطأ أثناء حفظ التسعيرة"); }
    };
    const startEditing = (p) => { setEditingId(p.id); setEditForm({ month: p.month, year: p.year, price_per_ampere: p.price_per_ampere }); };
    const cancelEditing = () => setEditingId(null);
    const saveEdit = async (id) => {
        try {
            await axios.put(`${API}/api/pricing/${id}`, { month: parseInt(editForm.month), year: parseInt(editForm.year), price_per_ampere: parseFloat(editForm.price_per_ampere) });
            setEditingId(null); fetchPricings();
        } catch (error) { alert(error.response?.data?.detail || "حدث خطأ أثناء التحديث"); }
    };
    const handleDelete = async (id) => {
        if (window.confirm("هل أنت متأكد من حذف هذه التسعيرة؟")) {
            try { await axios.delete(`${API}/api/pricing/${id}`); fetchPricings(); }
            catch (error) { alert(error.response?.data?.detail || "لا يمكن حذف التسعيرة"); }
        }
    };
    const handleGenerateInvoices = async (pricingId) => {
        if (window.confirm("هل أنت متأكد من توليد فواتير هذا الشهر لجميع المشتركين؟")) {
            setIsGenerating(true);
            try {
                const res = await axios.post(`${API}/api/invoices/generate/${pricingId}`);
                alert(res.data.message); fetchInvoices();
            } catch (error) { alert(error.response?.data?.detail || "حدث خطأ أثناء التوليد"); }
            finally { setIsGenerating(false); }
        }
    };

    // --- Invoice Actions ---
    const startInvEdit = (inv) => { setEditingInvId(inv.id); setInvEditForm({ total_required: inv.total_required, paid_amount: inv.paid_amount }); };
    const cancelInvEdit = () => setEditingInvId(null);
    const saveInvEdit = async (id) => {
        try {
            await axios.put(`${API}/api/invoices/${id}`, { total_required: parseFloat(invEditForm.total_required), paid_amount: parseFloat(invEditForm.paid_amount) });
            setEditingInvId(null); fetchInvoices();
        } catch (error) { alert(error.response?.data?.detail || "حدث خطأ أثناء التحديث"); }
    };
    const handleInvDelete = async (id) => {
        if (window.confirm("هل أنت متأكد من حذف هذه الفاتورة؟ سيتم حذف جميع المدفوعات المرتبطة بها أيضاً.")) {
            try { await axios.delete(`${API}/api/invoices/${id}`); fetchInvoices(); }
            catch (error) { alert(error.response?.data?.detail || "لا يمكن حذف الفاتورة"); }
        }
    };

    // Filter invoices
    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = !searchQuery || inv.subscriber_name.includes(searchQuery) || (inv.unit_number && inv.unit_number.includes(searchQuery));
        const matchesMonth = !filterMonth || inv.month_year === filterMonth;
        return matchesSearch && matchesMonth;
    });

    // Get unique months for filter dropdown
    const uniqueMonths = [...new Set(invoices.map(inv => inv.month_year))];

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans text-right" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><FileText size={28} /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">نظام الفوترة والتسعيرات</h1>
                            <p className="text-sm text-gray-500 mt-1">إدارة التسعيرات والفواتير الشهرية</p>
                        </div>
                    </div>
                    {activeTab === 'pricing' && (
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold shadow-sm">
                            <PlusCircle size={20} className="ml-2" />إضافة تسعيرة شهر جديد
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <button onClick={() => setActiveTab('pricing')} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${activeTab === 'pricing' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <Settings size={18} className="inline ml-2" />التسعيرات الشهرية
                    </button>
                    <button onClick={() => setActiveTab('invoices')} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <FileText size={18} className="inline ml-2" />الفواتير ({invoices.length})
                    </button>
                </div>

                {/* Formula Card */}
                <div className="bg-gradient-to-l from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100 flex items-center gap-4">
                    <AlertCircle size={20} className="text-purple-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700"><strong>معادلة الفاتورة:</strong> (عدد الأمبيرات × سعر الأمبير الشهري) + الديون السابقة</p>
                </div>

                {/* ═══ PRICING TAB ═══ */}
                {activeTab === 'pricing' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">الشهر</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">السنة</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">سعر الأمبير</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">توليد الفواتير</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">جاري التحميل...</td></tr>
                                ) : pricings.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">لا توجد تسعيرات. أضف أول تسعيرة شهرية.</td></tr>
                                ) : (
                                    pricings.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            {editingId === p.id ? (
                                                <>
                                                    <td className="px-6 py-3">
                                                        <select value={editForm.month} onChange={(e) => setEditForm({ ...editForm, month: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                                                            {MONTH_NAMES.map((name, i) => i > 0 && <option key={i} value={i}>{name} ({i})</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-3"><input type="number" value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} className="w-24 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" /></td>
                                                    <td className="px-6 py-3 text-center"><input type="number" value={editForm.price_per_ampere} onChange={(e) => setEditForm({ ...editForm, price_per_ampere: e.target.value })} className="w-32 p-2 border border-gray-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-purple-500" /></td>
                                                    <td className="px-6 py-3 text-center">—</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => saveEdit(p.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"><Check size={18} /></button>
                                                            <button onClick={cancelEditing} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition"><X size={18} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4"><span className="font-bold text-gray-900">{MONTH_NAMES[p.month]}</span><span className="text-xs text-gray-400 mr-1">({p.month})</span></td>
                                                    <td className="px-6 py-4 text-gray-700 font-mono">{p.year}</td>
                                                    <td className="px-6 py-4 text-center"><span className="inline-block px-4 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-lg text-sm">{formatCurrency(p.price_per_ampere)}</span></td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => handleGenerateInvoices(p.id)} disabled={isGenerating} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm border border-blue-200 disabled:opacity-50">
                                                            {isGenerating ? <RefreshCw size={16} className="animate-spin mx-auto" /> : 'توليد الفواتير'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => startEditing(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تعديل"><Edit2 size={18} /></button>
                                                            <button onClick={() => handleDelete(p.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="حذف"><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ═══ INVOICES TAB ═══ */}
                {activeTab === 'invoices' && (
                    <>
                        {/* Search & Filter Bar */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                                <input type="text" className="block w-full pr-12 pl-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="ابحث باسم المشترك أو رقم الوحدة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="relative">
                                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="appearance-none px-5 py-3 pr-10 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-700">
                                    <option value="">جميع الأشهر</option>
                                    {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Invoices Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <p className="text-sm text-gray-500 mb-1">إجمالي المطلوب</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.total_required, 0))}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <p className="text-sm text-gray-500 mb-1">إجمالي المدفوع</p>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0))}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <p className="text-sm text-gray-500 mb-1">إجمالي الديون</p>
                                <p className="text-2xl font-bold text-rose-600">{formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.remaining_debt, 0))}</p>
                            </div>
                        </div>

                        {/* Invoices Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">#</th>
                                        <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">المشترك</th>
                                        <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">المحطة</th>
                                        <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase">الشهر</th>
                                        <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase">المطلوب</th>
                                        <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase">المدفوع</th>
                                        <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase">المتبقي</th>
                                        <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase">الحالة</th>
                                        <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {isInvLoading ? (
                                        <tr><td colSpan="9" className="text-center py-8 text-gray-500">جاري التحميل...</td></tr>
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr><td colSpan="9" className="text-center py-8 text-gray-500">لا توجد فواتير {filterMonth ? 'لهذا الشهر' : ''}. قم بتوليد الفواتير من تبويب التسعيرات.</td></tr>
                                    ) : (
                                        filteredInvoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                                {editingInvId === inv.id ? (
                                                    <>
                                                        <td className="px-5 py-3 text-gray-400 text-sm">{inv.id}</td>
                                                        <td className="px-5 py-3 font-bold text-gray-900">{inv.subscriber_name}</td>
                                                        <td className="px-5 py-3 text-gray-500 text-sm">{inv.station_name}</td>
                                                        <td className="px-5 py-3 text-center text-sm">{inv.month_year}</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <input type="number" value={invEditForm.total_required} onChange={(e) => setInvEditForm({ ...invEditForm, total_required: e.target.value })} className="w-28 p-2 border border-gray-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-blue-500" />
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            <input type="number" value={invEditForm.paid_amount} onChange={(e) => setInvEditForm({ ...invEditForm, paid_amount: e.target.value })} className="w-28 p-2 border border-gray-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-emerald-500" />
                                                        </td>
                                                        <td className="px-5 py-3 text-center text-sm text-gray-400">—</td>
                                                        <td className="px-5 py-3 text-center text-sm text-gray-400">—</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <div className="flex justify-center gap-1">
                                                                <button onClick={() => saveInvEdit(inv.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"><Check size={16} /></button>
                                                                <button onClick={cancelInvEdit} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition"><X size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-5 py-4 text-gray-400 text-sm">{inv.id}</td>
                                                        <td className="px-5 py-4 font-bold text-gray-900">{inv.subscriber_name}</td>
                                                        <td className="px-5 py-4"><span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">{inv.station_name || '-'}</span></td>
                                                        <td className="px-5 py-4 text-center"><span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold">{inv.month_year}</span></td>
                                                        <td className="px-5 py-4 text-center font-bold text-gray-900">{formatCurrency(inv.total_required)}</td>
                                                        <td className="px-5 py-4 text-center font-bold text-emerald-600">{formatCurrency(inv.paid_amount)}</td>
                                                        <td className="px-5 py-4 text-center font-bold text-rose-600">{inv.remaining_debt > 0 ? formatCurrency(inv.remaining_debt) : '-'}</td>
                                                        <td className="px-5 py-4 text-center">
                                                            {inv.remaining_debt <= 0 ? (
                                                                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">✅ مسدد</span>
                                                            ) : (
                                                                <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">⏳ غير مسدد</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <div className="flex justify-center gap-1">
                                                                <button onClick={() => startInvEdit(inv)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تعديل"><Edit2 size={16} /></button>
                                                                <button onClick={() => handleInvDelete(inv.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="حذف"><Trash2 size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Add Pricing Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" dir="rtl">
                            <div className="flex items-center space-x-3 space-x-reverse mb-6 border-b pb-4">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Settings size={24} /></div>
                                <h2 className="text-2xl font-bold text-gray-800">إضافة تسعيرة شهر جديد</h2>
                            </div>
                            <form onSubmit={handleAddSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الشهر <span className="text-rose-500">*</span></label>
                                        <select value={addForm.month} onChange={(e) => setAddForm({ ...addForm, month: e.target.value })} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500">
                                            {MONTH_NAMES.map((name, i) => i > 0 && <option key={i} value={i}>{name} ({i})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">السنة <span className="text-rose-500">*</span></label>
                                        <input type="number" value={addForm.year} onChange={(e) => setAddForm({ ...addForm, year: e.target.value })} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر الأمبير الواحد (د.ع) <span className="text-rose-500">*</span></label>
                                    <input type="number" value={addForm.price_per_ampere} onChange={(e) => setAddForm({ ...addForm, price_per_ampere: e.target.value })} required placeholder="مثال: 15000" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xl font-bold text-purple-600 font-mono" />
                                </div>
                                <div className="pt-4 flex space-x-3 space-x-reverse">
                                    <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition font-bold">حفظ التسعيرة</button>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-bold">إلغاء</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default InvoicesBilling;
