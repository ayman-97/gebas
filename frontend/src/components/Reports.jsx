import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Filter, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Reports = () => {
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState('');

    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API}/api/reports/invoices`);
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report data:", error);
            // Fallback Mock Data
            setReportData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US').format(amount) + ' د.ع';
    };

    const filteredData = reportData.filter(item =>
        filterMonth === '' ? true : item.month_year.includes(filterMonth)
    );

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        // 1. Create CSV header
        const headers = ['رقم الفاتورة', 'اسم المشترك', 'رقم الوحدة', 'الشهر/السنة', 'المطلوب كلياً', 'المدفوع', 'المتبقي (الديون)'];

        // 2. Create CSV rows
        const rows = filteredData.map(item => [
            item.id,
            `"${item.subscriber_name}"`, // Quote strings that might contain commas
            `"${item.unit_number || 'غير محدد'}"`,
            item.month_year,
            item.total_required,
            item.paid_amount,
            item.remaining_debt
        ]);

        // 3. Combine 
        // Add BOM for UTF-8 (Arabic support in Excel)
        let csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');

        // 4. Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `تقرير_الفواتير_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans text-right" dir="rtl">
            {/* Hide controls when printing */}
            <style>
                {`
          @media print {
            /* Hide the sidebar and the main header from App.jsx */
            aside, header, nav, .h-16.bg-white.border-b { display: none !important; }
            
            /* Reset all margins/paddings that could disrupt the page */
            body, html, #root, main, .flex-1.overflow-auto {
                background-color: white !important;
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                overflow: visible !important;
            }
            
            /* The specific report component adjustments */
            .p-8.bg-gray-50 { padding: 0 !important; background-color: white !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .shadow-sm { box-shadow: none !important; }
            .border { border: 1px solid #e5e7eb !important; }
            
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { border: 1px solid #e5e7eb !important; padding: 6px !important; font-size: 12px !important; }
          }
        `}
            </style>

            <div className="max-w-7xl mx-auto space-y-6 print:space-y-4">

                {/* Print Header (Only visible in print) */}
                <div className="hidden print-only text-center mb-8 pb-4 border-b-2 border-gray-800">
                    <h1 className="text-3xl font-bold font-serif mb-2">نظام جباية المولدات الأهلية</h1>
                    <p className="text-xl">تقرير كشف الفواتير الشامل</p>
                    <p className="text-sm mt-2">تاريخ الطباعة: {new Date().toLocaleDateString('ar-IQ')}</p>
                </div>

                {/* Action Header */}
                <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 gap-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-teal-50 text-teal-600 rounded-xl">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">التقارير والكشوفات</h1>
                            <p className="text-sm text-gray-500 mt-1">عرض حالة الفواتير المتكاملة وتصدير الإيصالات</p>
                        </div>
                    </div>

                    <div className="flex bg-gray-50 p-2 rounded-xl border border-gray-200 gap-2 w-full md:w-auto">
                        <button
                            onClick={handleExportCSV}
                            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white text-gray-700 hover:text-teal-600 rounded-lg shadow-sm border border-gray-200 transition-colors font-medium"
                        >
                            <Download size={18} className="ml-2 text-teal-500" />
                            تصدير Excel (CSV)
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-sm transition-colors font-medium"
                        >
                            <Printer size={18} className="ml-2 border-teal-400" />
                            طباعة PDF / ورقي
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="no-print bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <Filter size={20} className="text-gray-400" />
                    <div className="flex-1 max-w-xs">
                        <input
                            type="text"
                            placeholder="تصفية حسب الشهر والسنة (مثال: 1/2026)"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        />
                    </div>
                    {filteredData.length > 0 && (
                        <div className="mr-auto text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            عدد النتائج: <span className="font-bold text-gray-800">{filteredData.length}</span>
                        </div>
                    )}
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto print:shadow-none print:border-none print:overflow-visible">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 print:bg-white">
                            <tr>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"># الفاتورة</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">اسم المشترك</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">رقم الوحدة</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">شهر/سنة</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100">المطلوب</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50">المدفوع</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-rose-600 uppercase tracking-wider bg-rose-50">المتبقي (الديون)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-8 text-gray-500">جاري تحميل التقرير...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-8 text-gray-500">لا يوجد بيانات مطابقة</td></tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            INV-{item.id.toString().padStart(4, '0')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-gray-900">{item.subscriber_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {item.unit_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold font-mono">
                                                {item.month_year}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-gray-700 bg-gray-50/50">
                                            {formatCurrency(item.total_required)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-emerald-600 bg-emerald-50/30">
                                            {formatCurrency(item.paid_amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center bg-rose-50/30">
                                            <span className={`font-bold ${item.remaining_debt > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                                                {formatCurrency(item.remaining_debt)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Print Footer Summary */}
                {filteredData.length > 0 && !isLoading && (
                    <div className="hidden print-only mt-8 pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-center px-12">
                            <div className="text-center">
                                <p className="font-bold text-gray-800 mb-10">توقيع المحاسب المستلم</p>
                                <p className="text-gray-500 border-t border-gray-400 pt-2 px-8">........................</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-800 mb-10">توقيع الإدارة / الختم</p>
                                <p className="text-gray-500 border-t border-gray-400 pt-2 px-8">........................</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
