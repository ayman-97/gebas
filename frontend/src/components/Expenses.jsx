import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Calendar, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ description: '', amount: '' });

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API}/api/expenses`);
            setExpenses(response.data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
            setExpenses([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/api/expenses`, {
                description: formData.description,
                amount: parseFloat(formData.amount)
            });
            fetchExpenses();
            setIsModalOpen(false);
            setFormData({ description: '', amount: '' });
        } catch (error) {
            console.error("Error saving expense", error);
            alert("حدث خطأ أثناء حفظ المصروف");
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US').format(amount) + ' د.ع';

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-IQ', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans text-right" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-2 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-xl"><CreditCard size={28} /></div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">إدارة المصروفات</h1>
                                <p className="text-sm text-gray-500 mt-1">سجل نفقات المولدات والصيانة والتشغيل اليومية</p>
                            </div>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-5 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-bold shadow-sm">
                            <Plus size={20} className="ml-2" />تسجيل مصروف جديد
                        </button>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-6 rounded-2xl shadow-md text-white flex flex-col justify-center">
                        <p className="text-orange-100 font-medium mb-1">إجمالي المصروفات المسجلة</p>
                        <h3 className="text-3xl font-bold">{formatCurrency(totalExpenses)}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                            <Calendar size={20} className="ml-2 text-gray-400" />أحدث السجلات
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-500">جاري تحميل السجلات...</div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">لا توجد مصروفات مسجلة بعد</div>
                        ) : (
                            expenses.map((expense) => (
                                <div key={expense.id} className="p-6 hover:bg-orange-50/30 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{expense.description}</h3>
                                        <p className="text-sm text-gray-500 flex items-center"><Calendar size={14} className="ml-1" />{formatDate(expense.expense_date)}</p>
                                    </div>
                                    <span className="inline-block px-4 py-2 bg-rose-50 text-rose-700 font-bold rounded-xl whitespace-nowrap">{formatCurrency(expense.amount)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" dir="rtl">
                            <div className="flex items-center space-x-3 space-x-reverse mb-6 border-b pb-4">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><CreditCard size={24} /></div>
                                <h2 className="text-2xl font-bold text-gray-800">تسجيل مصروف جديد</h2>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">الوصف / البيان <span className="text-rose-500">*</span></label>
                                    <textarea name="description" required rows="3" placeholder="مثال: صيانة مولد رقم 1، شراء زيوت..." value={formData.description} onChange={handleInputChange} className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ (د.ع) <span className="text-rose-500">*</span></label>
                                    <input type="number" name="amount" required placeholder="0" value={formData.amount} onChange={handleInputChange} className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xl font-bold" />
                                </div>
                                <div className="pt-4 flex space-x-3 space-x-reverse">
                                    <button type="submit" className="flex-1 bg-orange-600 text-white py-4 rounded-xl hover:bg-orange-700 transition font-bold shadow-sm">تأكيد وحفظ</button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 transition font-bold">إلغاء</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Expenses;
