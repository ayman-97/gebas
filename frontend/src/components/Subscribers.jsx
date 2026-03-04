import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Edit2, Trash2, Home, MapPin, Wallet, History, Printer } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:8000';

const Subscribers = () => {
    const [stations, setStations] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [isStationModalOpen, setIsStationModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [payingSub, setPayingSub] = useState(null);
    const [receiptData, setReceiptData] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [payForm, setPayForm] = useState({ amount: '', receipt_number: '' });
    const [isPaySubmitting, setIsPaySubmitting] = useState(false);
    const [subForm, setSubForm] = useState({ station_id: '', name: '', unit_number: '', amperes_count: '', initial_debt: '0' });
    const [stationForm, setStationForm] = useState({ station_name: '' });

    const fetchStations = async () => {
        try { setStations((await axios.get(`${API}/api/stations`)).data); } catch { setStations([]); }
    };
    const fetchSubscribers = async () => {
        setIsLoading(true);
        try {
            const url = selectedStation ? `${API}/api/subscribers?station_id=${selectedStation}` : `${API}/api/subscribers`;
            setSubscribers((await axios.get(url)).data);
        } catch { setSubscribers([]); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchStations(); }, []);
    useEffect(() => { fetchSubscribers(); }, [selectedStation]);

    // Station Actions
    const handleAddStation = async (e) => {
        e.preventDefault();
        try { await axios.post(`${API}/api/stations`, stationForm); fetchStations(); setIsStationModalOpen(false); setStationForm({ station_name: '' }); }
        catch { alert("حدث خطأ أثناء إضافة المحطة"); }
    };
    const handleDeleteStation = async (id) => {
        if (window.confirm("هل أنت متأكد من حذف هذه المحطة؟")) {
            try { await axios.delete(`${API}/api/stations/${id}`); if (selectedStation === id) setSelectedStation(null); fetchStations(); }
            catch (e) { alert(e.response?.data?.detail || "لا يمكن حذف المحطة"); }
        }
    };

    // Subscriber Actions
    const openAddSub = () => { setEditingSub(null); setSubForm({ station_id: selectedStation || (stations[0]?.station_id || ''), name: '', unit_number: '', amperes_count: '', initial_debt: '0' }); setIsSubModalOpen(true); };
    const openEditSub = (sub) => { setEditingSub(sub); setSubForm({ station_id: sub.station_id, name: sub.name, unit_number: sub.unit_number || '', amperes_count: sub.amperes_count, initial_debt: sub.initial_debt }); setIsSubModalOpen(true); };
    const handleSubSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...subForm, station_id: parseInt(subForm.station_id), amperes_count: parseFloat(subForm.amperes_count), initial_debt: parseFloat(subForm.initial_debt || 0) };
        try { if (editingSub) await axios.put(`${API}/api/subscribers/${editingSub.id}`, payload); else await axios.post(`${API}/api/subscribers`, payload); fetchSubscribers(); setIsSubModalOpen(false); }
        catch (e) { alert(e.response?.data?.detail || "حدث خطأ أثناء الحفظ"); }
    };
    const handleDeleteSub = async (id) => {
        if (window.confirm("هل أنت متأكد من حذف هذا المشترك؟")) {
            try { await axios.delete(`${API}/api/subscribers/${id}`); fetchSubscribers(); }
            catch (e) { alert(e.response?.data?.detail || "لا يمكن حذف المشترك"); }
        }
    };

    // Payment Actions
    const openPayModal = (sub) => { setPayingSub(sub); setPayForm({ amount: '', receipt_number: '' }); setIsPayModalOpen(true); };
    const handlePaySubmit = async (e) => {
        e.preventDefault();
        setIsPaySubmitting(true);
        try {
            const res = await axios.post(`${API}/api/payments`, { subscriber_id: payingSub.id, amount: parseFloat(payForm.amount), receipt_number: payForm.receipt_number || null });
            setIsPayModalOpen(false);
            setReceiptData(res.data.receipt);
            setIsReceiptOpen(true);
        } catch (error) { alert(error.response?.data?.detail || "حدث خطأ أثناء تسجيل الدفعة"); }
        finally { setIsPaySubmitting(false); }
    };

    // History Actions
    const openHistory = async (sub) => {
        setHistoryLoading(true);
        setIsHistoryOpen(true);
        try {
            const res = await axios.get(`${API}/api/subscribers/${sub.id}/history`);
            setHistoryData(res.data);
        } catch { setHistoryData(null); alert("حدث خطأ أثناء جلب السجل"); }
        finally { setHistoryLoading(false); }
    };

    // Print Receipt
    const printReceipt = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(`
        <html dir="rtl"><head><title>إيصال دفع</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #333; }
            .receipt { max-width: 350px; margin: 0 auto; border: 2px solid #1e40af; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; }
            .header h1 { font-size: 18px; margin-bottom: 4px; }
            .header p { font-size: 12px; opacity: 0.85; }
            .body { padding: 20px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; font-size: 14px; }
            .row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: bold; color: #111; }
            .total { background: #f0fdf4; padding: 12px; border-radius: 8px; margin-top: 12px; text-align: center; }
            .total .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .remaining { background: #fef2f2; padding: 8px; border-radius: 8px; margin-top: 8px; text-align: center; font-size: 13px; color: #dc2626; }
            .footer { text-align: center; padding: 16px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
            .receipt-no { background: #eff6ff; padding: 8px; border-radius: 8px; text-align: center; margin-bottom: 12px; font-size: 13px; color: #1e40af; font-weight: bold; }
        </style></head><body>
        <div class="receipt">
            <div class="header">
                <h1>⚡ نظام جباية المولدات</h1>
                <p>إيصال تسديد</p>
            </div>
            <div class="body">
                <div class="receipt-no">رقم الوصل: ${receiptData.receipt_number}</div>
                <div class="row"><span class="label">المشترك</span><span class="value">${receiptData.subscriber_name}</span></div>
                <div class="row"><span class="label">المحطة</span><span class="value">${receiptData.station_name || '-'}</span></div>
                <div class="row"><span class="label">الوحدة</span><span class="value">${receiptData.unit_number || '-'}</span></div>
                <div class="row"><span class="label">التاريخ</span><span class="value">${receiptData.date}</span></div>
                <div class="row"><span class="label">إجمالي الفاتورة</span><span class="value">${receiptData.invoice_total?.toLocaleString()} د.ع</span></div>
                <div class="row"><span class="label">إجمالي المدفوع</span><span class="value">${receiptData.total_paid?.toLocaleString()} د.ع</span></div>
                <div class="total">
                    <div style="font-size:12px;color:#6b7280;margin-bottom:4px">المبلغ المستلم</div>
                    <div class="amount">${receiptData.amount?.toLocaleString()} د.ع</div>
                </div>
                ${receiptData.remaining > 0 ? `<div class="remaining">المتبقي: ${receiptData.remaining?.toLocaleString()} د.ع</div>` : '<div style="background:#f0fdf4;padding:8px;border-radius:8px;margin-top:8px;text-align:center;font-size:13px;color:#059669;font-weight:bold">✅ تم التسديد بالكامل</div>'}
            </div>
            <div class="footer">شكراً لتسديدكم • ${new Date().getFullYear()}</div>
        </div>
        <script>setTimeout(()=>{window.print();},300);<\/script>
        </body></html>`);
        printWindow.document.close();
    };

    const filteredSubscribers = subscribers.filter(sub =>
        sub.name.includes(searchQuery) || (sub.unit_number && sub.unit_number.includes(searchQuery))
    );

    const formatCurrency = (n) => (n || 0).toLocaleString() + ' د.ع';

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans text-right" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                        <div><h1 className="text-2xl font-bold text-gray-800">إدارة المشتركين</h1><p className="text-sm text-gray-500">إجمالي المشتركين: {subscribers.length}</p></div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsStationModalOpen(true)} className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition font-bold"><MapPin size={18} className="ml-2" />إضافة محطة</button>
                        <button onClick={openAddSub} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold"><UserPlus size={18} className="ml-2" />إضافة مشترك</button>
                    </div>
                </div>

                {/* Station Tabs */}
                <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <button onClick={() => setSelectedStation(null)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${!selectedStation ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>جميع المحطات</button>
                    {stations.map(st => (
                        <div key={st.station_id} className="relative group">
                            <button onClick={() => setSelectedStation(st.station_id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedStation === st.station_id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><MapPin size={14} className="inline ml-1" />{st.station_name}</button>
                            <button onClick={() => handleDeleteStation(st.station_id)} className="absolute -top-2 -left-2 hidden group-hover:flex items-center justify-center w-5 h-5 bg-rose-500 text-white rounded-full text-xs hover:bg-rose-600 shadow" title="حذف المحطة">×</button>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" className="block w-full pr-12 pl-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="ابحث بالاسم أو رقم الوحدة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">الاسم</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">المحطة</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">رقم الوحدة</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">الأمبيرات</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-500">جاري التحميل...</td></tr>
                            ) : filteredSubscribers.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-500">لا يوجد مشتركين {selectedStation ? 'في هذه المحطة' : ''}</td></tr>
                            ) : (
                                filteredSubscribers.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{sub.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><MapPin size={12} className="ml-1" />{sub.station_name || 'غير محدد'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500"><div className="flex items-center"><Home size={14} className="ml-1 text-gray-400" />{sub.unit_number || 'غير محدد'}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 font-bold">{sub.amperes_count} A</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center gap-1">
                                                <button onClick={() => openPayModal(sub)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="تسديد دفعة"><Wallet size={18} /></button>
                                                <button onClick={() => openHistory(sub)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="سجل المدفوعات"><History size={18} /></button>
                                                <button onClick={() => openEditSub(sub)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تعديل"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDeleteSub(sub.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="حذف"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ═══════════ MODALS ═══════════ */}

                {/* Add/Edit Subscriber Modal */}
                {isSubModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl" dir="rtl">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">{editingSub ? 'تعديل بيانات المشترك' : 'إضافة مشترك جديد'}</h2>
                            <form onSubmit={handleSubSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">المحطة <span className="text-rose-500">*</span></label>
                                    <select required value={subForm.station_id} onChange={(e) => setSubForm({ ...subForm, station_id: e.target.value })} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                                        <option value="">اختر المحطة</option>
                                        {stations.map(st => <option key={st.station_id} value={st.station_id}>{st.station_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشترك <span className="text-rose-500">*</span></label>
                                    <input type="text" required value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوحدة</label>
                                        <input type="text" value={subForm.unit_number} onChange={(e) => setSubForm({ ...subForm, unit_number: e.target.value })} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الأمبيرات <span className="text-rose-500">*</span></label>
                                        <input type="number" step="0.5" required value={subForm.amperes_count} onChange={(e) => setSubForm({ ...subForm, amperes_count: e.target.value })} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ديون سابقة</label>
                                    <input type="number" value={subForm.initial_debt} onChange={(e) => setSubForm({ ...subForm, initial_debt: e.target.value })} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="pt-4 flex space-x-3 space-x-reverse">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-bold">{editingSub ? 'حفظ التعديلات' : 'حفظ المشترك'}</button>
                                    <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-bold">إلغاء</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Station Modal */}
                {isStationModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl" dir="rtl">
                            <div className="flex items-center space-x-3 space-x-reverse mb-6 border-b pb-4">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><MapPin size={24} /></div>
                                <h2 className="text-2xl font-bold text-gray-800">إضافة محطة جديدة</h2>
                            </div>
                            <form onSubmit={handleAddStation} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم المحطة <span className="text-rose-500">*</span></label>
                                    <input type="text" required placeholder="مثال: محطة الحي الصناعي" value={stationForm.station_name} onChange={(e) => setStationForm({ station_name: e.target.value })} className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div className="pt-4 flex space-x-3 space-x-reverse">
                                    <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition font-bold">حفظ المحطة</button>
                                    <button type="button" onClick={() => setIsStationModalOpen(false)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-bold">إلغاء</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {isPayModalOpen && payingSub && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" dir="rtl">
                            <div className="flex items-center space-x-3 space-x-reverse mb-6 border-b pb-4">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Wallet size={24} /></div>
                                <h2 className="text-2xl font-bold text-gray-800">تسديد دفعة</h2>
                            </div>
                            <div className="bg-blue-50/80 rounded-xl p-4 mb-6 border border-blue-100">
                                <p className="text-sm text-blue-600 mb-1">المشترك</p>
                                <p className="font-bold text-gray-900 text-lg">{payingSub.name}</p>
                                <p className="text-xs text-gray-500 mt-1">المحطة: {payingSub.station_name || '-'} | الوحدة: {payingSub.unit_number || '-'} | {payingSub.amperes_count} أمبير</p>
                            </div>
                            <form onSubmit={handlePaySubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ المستلم (د.ع) <span className="text-rose-500">*</span></label>
                                    <input type="number" required placeholder="0" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-xl font-bold text-emerald-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الوصل (اختياري - يولّد تلقائياً)</label>
                                    <input type="text" placeholder="يترك فارغاً للتوليد التلقائي" value={payForm.receipt_number} onChange={(e) => setPayForm({ ...payForm, receipt_number: e.target.value })} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div className="pt-4 flex space-x-3 space-x-reverse">
                                    <button type="submit" disabled={isPaySubmitting} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition font-bold disabled:opacity-50">
                                        {isPaySubmitting ? 'جاري الحفظ...' : 'تأكيد وتسجيل الدفعة'}
                                    </button>
                                    <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-bold">إلغاء</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Receipt Modal (after successful payment) */}
                {isReceiptOpen && receiptData && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" dir="rtl">
                            <div className="bg-gradient-to-l from-blue-600 to-blue-800 text-white p-6 text-center">
                                <h2 className="text-xl font-bold mb-1">✅ تم تسجيل الدفعة بنجاح</h2>
                                <p className="text-blue-200 text-sm">إيصال رقم: {receiptData.receipt_number}</p>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between py-2 border-b border-dashed border-gray-200"><span className="text-gray-500">المشترك</span><span className="font-bold">{receiptData.subscriber_name}</span></div>
                                <div className="flex justify-between py-2 border-b border-dashed border-gray-200"><span className="text-gray-500">المحطة</span><span className="font-bold">{receiptData.station_name || '-'}</span></div>
                                <div className="flex justify-between py-2 border-b border-dashed border-gray-200"><span className="text-gray-500">التاريخ</span><span className="font-bold">{receiptData.date}</span></div>
                                <div className="flex justify-between py-2 border-b border-dashed border-gray-200"><span className="text-gray-500">إجمالي الفاتورة</span><span className="font-bold">{formatCurrency(receiptData.invoice_total)}</span></div>
                                <div className="bg-emerald-50 rounded-xl p-4 text-center mt-4">
                                    <p className="text-sm text-emerald-600 mb-1">المبلغ المستلم</p>
                                    <p className="text-3xl font-bold text-emerald-700">{formatCurrency(receiptData.amount)}</p>
                                </div>
                                {receiptData.remaining > 0 && (
                                    <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-sm text-rose-600 font-bold">المتبقي: {formatCurrency(receiptData.remaining)}</p></div>
                                )}
                                {receiptData.remaining <= 0 && (
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-sm text-emerald-600 font-bold">✅ تم التسديد بالكامل</p></div>
                                )}
                            </div>
                            <div className="p-6 pt-0 flex space-x-3 space-x-reverse">
                                <button onClick={printReceipt} className="flex-1 flex items-center justify-center bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-bold"><Printer size={18} className="ml-2" />طباعة الإيصال</button>
                                <button onClick={() => setIsReceiptOpen(false)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-bold">إغلاق</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Modal */}
                {isHistoryOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><History size={24} /></div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">سجل المدفوعات والفواتير</h2>
                                        {historyData?.subscriber && <p className="text-sm text-gray-500">{historyData.subscriber.name} - {historyData.subscriber.station_name} | {historyData.subscriber.amperes_count} أمبير</p>}
                                    </div>
                                </div>
                                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {historyLoading ? (
                                    <div className="text-center py-12 text-gray-500">جاري تحميل السجل...</div>
                                ) : !historyData?.history?.length ? (
                                    <div className="text-center py-12 text-gray-400">لا توجد فواتير أو مدفوعات مسجلة لهذا المشترك</div>
                                ) : (
                                    <div className="space-y-4">
                                        {historyData.history.map((inv) => (
                                            <div key={inv.invoice_id} className="border border-gray-200 rounded-2xl overflow-hidden">
                                                <div className="bg-gray-50 px-5 py-3 flex justify-between items-center">
                                                    <div className="flex items-center space-x-3 space-x-reverse">
                                                        <span className="text-sm font-bold text-gray-700">📅 فاتورة شهر {inv.month_year}</span>
                                                    </div>
                                                    <div className="flex gap-4 text-sm">
                                                        <span className="text-gray-500">المطلوب: <b className="text-gray-800">{formatCurrency(inv.total_required)}</b></span>
                                                        <span className="text-gray-500">المدفوع: <b className="text-emerald-600">{formatCurrency(inv.paid_amount)}</b></span>
                                                        {inv.remaining > 0 && <span className="text-rose-600 font-bold">المتبقي: {formatCurrency(inv.remaining)}</span>}
                                                        {inv.remaining <= 0 && <span className="text-emerald-600 font-bold">✅ مسدد</span>}
                                                    </div>
                                                </div>
                                                {inv.payments.length > 0 ? (
                                                    <div className="divide-y divide-gray-100">
                                                        {inv.payments.map((p) => (
                                                            <div key={p.id} className="px-5 py-3 flex justify-between items-center hover:bg-blue-50/30 transition-colors">
                                                                <div>
                                                                    <span className="text-sm text-emerald-700 font-bold">💰 {formatCurrency(p.amount)}</span>
                                                                    {p.receipt_number && <span className="text-xs text-gray-400 mr-3">وصل: {p.receipt_number}</span>}
                                                                </div>
                                                                <span className="text-xs text-gray-500">{p.date}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="px-5 py-3 text-sm text-gray-400 text-center">لا توجد دفعات مسجلة لهذه الفاتورة</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Subscribers;
