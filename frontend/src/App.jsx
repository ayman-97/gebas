import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Subscribers from './components/Subscribers';
import InvoicesBilling from './components/InvoicesBilling';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import { Home, Users, FileText, CreditCard, Printer, Menu, X } from 'lucide-react';

function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-gray-50 text-right" dir="rtl">
            {/* Sidebar */}
            <aside className={`bg-white border-l border-gray-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                    {isSidebarOpen && <span className="font-bold text-xl text-blue-600 truncate">نظام جباية المولدات</span>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 mx-auto">
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`w-full flex items-center p-3 rounded-xl transition-colors ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Home size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
                        {isSidebarOpen && <span className="font-medium truncate">لوحة القيادة</span>}
                    </button>

                    <button
                        onClick={() => setCurrentView('subscribers')}
                        className={`w-full flex items-center p-3 rounded-xl transition-colors ${currentView === 'subscribers' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Users size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
                        {isSidebarOpen && <span className="font-medium truncate">المشتركين</span>}
                    </button>

                    <button
                        onClick={() => setCurrentView('billing')}
                        className={`w-full flex items-center p-3 rounded-xl transition-colors ${currentView === 'billing' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FileText size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
                        {isSidebarOpen && <span className="font-medium truncate">الفوترة</span>}
                    </button>

                    <button
                        onClick={() => setCurrentView('expenses')}
                        className={`w-full flex items-center p-3 rounded-xl transition-colors ${currentView === 'expenses' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <CreditCard size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
                        {isSidebarOpen && <span className="font-medium truncate">المصروفات</span>}
                    </button>

                    <button
                        onClick={() => setCurrentView('reports')}
                        className={`w-full flex items-center p-3 rounded-xl transition-colors ${currentView === 'reports' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Printer size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
                        {isSidebarOpen && <span className="font-medium truncate">التقارير</span>}
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50">
                <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800">
                        {currentView === 'dashboard' ? 'نظرة عامة' :
                            currentView === 'subscribers' ? 'إدارة المشتركين' :
                                currentView === 'billing' ? 'الفوترة' :
                                    currentView === 'expenses' ? 'المصروفات' :
                                        currentView === 'reports' ? 'التقارير' : 'الصندوق'}
                    </h2>
                </div>
                <div className="p-4">
                    {currentView === 'dashboard' ? <Dashboard /> :
                        currentView === 'subscribers' ? <Subscribers /> :
                            currentView === 'billing' ? <InvoicesBilling /> :
                                currentView === 'expenses' ? <Expenses /> : <Reports />}
                </div>
            </main>
        </div>
    );
}

export default App;
