'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiTrendingUp, FiSettings, FiLogOut, FiPlusCircle, FiMenu, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import Image from 'next/image';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, token, setUser, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    useEffect(() => {
        const loadProfile = async () => {
            if (!token) {
                router.replace('/login');
                return;
            }

            if (user) {
                return;
            }

            try {
                const response = await api.get('/users/profile');
                setUser(response.data);
            } catch (error) {
                console.error('Failed to load profile:', error);
                logout();
                router.replace('/login');
            }
        };

        loadProfile();
    }, [token, user, setUser, logout, router]);

    useEffect(() => {
        const isDarkMode = user?.settings?.darkMode ?? true;
        document.documentElement.classList.toggle('theme-light', !isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [user?.settings?.darkMode]);

    return (
        <div className="h-screen bg-background flex overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col fixed left-0 top-0 h-screen overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <Image src="/interviewpilot-logo.svg" alt="InterviewPilot logo" width={32} height={32} />
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">InterviewPilot</h2>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname === '/dashboard'
                                ? 'text-text-main bg-white/10'
                                : 'text-text-muted hover:text-text-main hover:bg-white/5'
                        }`}
                    >
                        <FiHome className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>
                    <Link
                        href="/dashboard/history"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname?.startsWith('/dashboard/history')
                                ? 'text-text-main bg-white/5'
                                : 'text-text-muted hover:text-text-main hover:bg-white/5'
                        }`}
                    >
                        <FiTrendingUp className="w-5 h-5" />
                        <span>History</span>
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname?.startsWith('/dashboard/settings')
                                ? 'text-text-main bg-white/5'
                                : 'text-text-muted hover:text-text-main hover:bg-white/5'
                        }`}
                    >
                        <FiSettings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="mb-4 px-4 py-2">
                        <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-text-muted">{user?.role || 'Engineer'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Sidebar - Mobile */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
            <aside className={`fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col z-50 md:hidden transform transition-transform ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/interviewpilot-logo.svg" alt="InterviewPilot logo" width={32} height={32} />
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">InterviewPilot</h2>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname === '/dashboard'
                                ? 'text-text-main bg-white/10'
                                : 'text-text-muted hover:text-text-main hover:bg-white/5'
                        }`}
                    >
                        <FiHome className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>
                    <Link
                        href="/dashboard/history"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname?.startsWith('/dashboard/history')
                                ? 'text-text-main bg-white/5'
                                : 'text-text-muted hover:text-text-main hover:bg-white/5'
                        }`}
                    >
                        <FiTrendingUp className="w-5 h-5" />
                        <span>History</span>
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname?.startsWith('/dashboard/settings')
                                ? 'text-text-main bg-white/5'
                                : 'text-text-muted hover:text-text-main hover:bg-white/5'
                        }`}
                    >
                        <FiSettings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="mb-4 px-4 py-2">
                        <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-text-muted">{user?.role || 'Engineer'}</p>
                    </div>
                    <button
                        onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                        }}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 h-screen overflow-hidden flex flex-col">
                <header className="bg-surface/50 backdrop-blur-md border-b border-border sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-4">
                    <div className="flex items-center gap-4 md:gap-0">
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 hover:bg-white/10 rounded transition-colors"
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>
                        <div className="md:hidden flex items-center gap-2">
                            <Image src="/interviewpilot-logo.svg" alt="InterviewPilot logo" width={24} height={24} />
                            <h2 className="text-lg md:text-xl font-bold text-white">InterviewPilot</h2>
                        </div>
                    </div>
                    <div className="hidden md:block flex-1">
                        {/* Breadcrumbs or greeting could go here */}
                        <p className="text-text-muted">Welcome back, <span className="text-white font-medium">{user?.name}</span></p>
                    </div>

                    <Link
                        href="/interview/setup"
                        className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-white px-3 md:px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary/20 text-sm md:text-base"
                    >
                        <FiPlusCircle className="w-4 md:w-5 h-4 md:h-5" />
                        <span className="hidden sm:inline">New Interview</span>
                        <span className="sm:hidden">Interview</span>
                    </Link>
                </header>

                <div className="p-4 md:p-8 flex-1 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
