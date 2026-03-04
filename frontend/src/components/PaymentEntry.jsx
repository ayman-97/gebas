import React, { useState, useEffect } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PaymentEntry = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [subscribers, setSubscribers] = useState([]);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                const res = await axios.get(`${API}/api/subscribers`);
                setSubscribers(res.data);
            } catch (e) {
                setSubscribers([]);
            }
        };
        fetchSubscribers();
    }, []);

    const filteredSubs = searchQuery.length > 0
        ? subscribers.filter(s => s.name.includes(searchQuery) || (s.unit_number && s.unit_number.includes(searchQuery)))
        : [];

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API}/api/payments`, {
                subscriber_id: selectedSubscriber.id,
                amount: parseFloat(paymentAmount),
                receipt_number: receiptNumber || null
            });
            alert(res.data.message);
            setSelectedSubscriber(null);
            setPaymentAmount('');
            setReceiptNumber('');
            setSearchQuery('');
        } catch (error) {
            alert(error.response?.data?.detail || "حدث خطأ أثناء تسجيل الدفعة");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans text-right" dir="rtl">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-2xl font-bold text-gray-800">تسجيل دفعة جديدة (الصندوق)</h2>
                    <p className="text-sm text-gray-500 mt-1">أدخل بيانات المشترك والمبلغ المستلم بدقة.</p>
                </div>

                <div className="p-6">
                    {!selectedSubscriber ? (
                        <div className="space-y-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pr-10 pl-3 py-3 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-white shadow-sm"
                                    placeholder="ابحث عن اسم المشترك أو رقم الوحدة..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {filteredSubs.length > 0 && (
                                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white max-h-72 overflow-y-auto">
                                    {filteredSubs.map(sub => (
                                        <div
                                            key={sub.id}
                                            className="p-4 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                                            onClick={() => { setSelectedSubscriber(sub); setPaymentAmount(''); }}
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800">{sub.name}</p>
                                                <p className="text-sm text-gray-500">الوحدة: {sub.unit_number || '-'} | المحطة: {sub.station_name || '-'}</p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm text-gray-500 mb-1">الأمبيرات</p>
                                                <p className="font-bold text-gray-700">{sub.amperes_count} A</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchQuery.length > 0 && filteredSubs.length === 0 && (
                                <div className="text-center py-4 text-gray-400">لا يوجد مشترك بهذا الاسم</div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handlePaymentSubmit} className="space-y-6">
                            <div className="bg-blue-50/80 rounded-xl p-4 flex justify-between items-center border border-blue-100 shadow-sm">
                                <div>
                                    <p className="text-sm text-blue-600 mb-1">المشترك المحدد</p>
                                    <p className="font-bold text-gray-900 text-lg">{selectedSubscriber.name}</p>
                                    <p className="text-xs text-gray-500">المحطة: {selectedSubscriber.station_name || '-'} | الوحدة: {selectedSubscriber.unit_number || '-'}</p>
                                </div>
                                <button type="button" onClick={() => setSelectedSubscriber(null)} className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                    تغيير المشترك
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ المستلم (د.ع)</label>
                                    <input type="number" required className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الوصل (إن وجد)</label>
                                    <input type="text" className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} placeholder="مثال: 10045" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all hover:-translate-y-0.5">
                                    {isSubmitting ? 'جاري الحفظ...' : (<><CheckCircle className="ml-2 h-5 w-5" />تأكيد وتسجيل الدفعة</>)}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentEntry;
