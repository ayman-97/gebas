import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Subscribers from './components/Subscribers';
import InvoicesBilling from './components/InvoicesBilling';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import Login from './components/Login';
import UsersManagement from './components/UsersManagement';
import AuditLog from './components/AuditLog';
import { Home, Users as UsersIcon, FileText, CreditCard, Printer, Shield, History, LogOut, Menu, X } from 'lucide-react';

function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Initial Auth Check
    useEffect(() => {
        const token = localStorage.getItem('gebas_token');
        const user = localStorage.getItem('gebas_user');
        if (token && user) {
            setIsAuthenticated(true);
            setCurrentUser(JSON.parse(user));
        }
    }, []);

    // Axios Interceptor for Token Injection and 401 Handling
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('gebas_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    const handleLoginSuccess = (user) => {
        setIsAuthenticated(true);
        setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('gebas_token');
        localStorage.removeItem('gebas_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

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
                        <UsersIcon size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
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

                    {/* Admin Only Links */}
                    {currentUser?.role === 'admin' && (
                        <>
                            <div className="my-4 border-t border-gray-100"></div>

                            <button
                                onClick={() => setCurrentView('users')}
                                className={`w-full flex items-center p-3 rounded-xl transition-colors ${currentView === 'users' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Shield size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
                                {isSidebarOpen && <span className="font-medium truncate">إدارة المستخدمين</span>}
                            </button>

                            <button
                                onClick={() => setCurrentView('audit')}
                                className={`w-full flex items-center p-3 rounded-xl transition-colors ${currentView === 'audit' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <History size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
                                {isSidebarOpen && <span className="font-medium truncate">سجل النظام</span>}
                            </button>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 rounded-xl transition-colors text-rose-600 hover:bg-rose-50"
                    >
                        <LogOut size={24} className={isSidebarOpen ? 'ml-3' : 'mx-auto'} />
                        {isSidebarOpen && <span className="font-medium truncate">تسجيل الخروج</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50">
                <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        {currentView === 'dashboard' ? 'نظرة عامة' :
                            currentView === 'subscribers' ? 'إدارة المشتركين' :
                                currentView === 'billing' ? 'الفوترة' :
                                    currentView === 'expenses' ? 'المصروفات' :
                                        currentView === 'reports' ? 'التقارير' :
                                            currentView === 'users' ? 'المستخدمين والصلاحيات' :
                                                currentView === 'audit' ? 'سجل المراقبة' : ''}
                    </h2>

                    <div className="mr-auto flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                        <div className={`w-2 h-2 rounded-full ${currentUser?.role === 'admin' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        <span className="text-sm font-bold text-gray-700">{currentUser?.username}</span>
                        <span className="text-xs text-gray-400">({currentUser?.role === 'admin' ? 'مدير' : 'محاسب'})</span>
                    </div>
                </div>
                <div className="p-4">
                    {currentView === 'dashboard' ? <Dashboard /> :
                        currentView === 'subscribers' ? <Subscribers /> :
                            currentView === 'billing' ? <InvoicesBilling /> :
                                currentView === 'expenses' ? <Expenses /> :
                                    currentView === 'reports' ? <Reports /> :
                                        currentView === 'users' && currentUser?.role === 'admin' ? <UsersManagement /> :
                                            currentView === 'audit' && currentUser?.role === 'admin' ? <AuditLog /> : <Dashboard />}
                </div>
            </main>
        </div>
    );
}

export default App;
