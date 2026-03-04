import React, { useState, useEffect } from 'react';
import { Wallet, Users, AlertCircle, FileText, CreditCard } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:8000';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    expectedRevenue: 0,
    collected: 0,
    unpaidDebt: 0,
    activeSubscribers: 0,
    totalExpenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API}/api/metrics`);
        setMetrics(res.data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US').format(amount) + ' د.ع';
  };

  const cards = [
    { label: 'الإيرادات المتوقعة', value: formatCurrency(metrics.expectedRevenue), icon: FileText, color: 'blue' },
    { label: 'إجمالي المقبوضات', value: formatCurrency(metrics.collected), icon: Wallet, color: 'emerald' },
    { label: 'الديون غير المسددة', value: formatCurrency(metrics.unpaidDebt), icon: AlertCircle, color: 'rose' },
    { label: 'المشتركين النشطين', value: metrics.activeSubscribers, icon: Users, color: 'purple' },
    { label: 'إجمالي المصروفات', value: formatCurrency(metrics.totalExpenses), icon: CreditCard, color: 'orange' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-right" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">لوحة القيادة</h1>

        {isLoading ? (
          <div className="text-center py-16 text-gray-500">جاري تحميل البيانات...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4 space-x-reverse transition-transform hover:-translate-y-1 hover:shadow-md cursor-default">
                  <div className={`p-4 rounded-xl ${colorMap[card.color]}`}>
                    <Icon size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                    <h3 className="text-xl font-bold text-gray-800 mt-1">{card.value}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
