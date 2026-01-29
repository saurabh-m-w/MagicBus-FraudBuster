'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AIChatWidget from '../../components/AIChatWidget';
import SupportAgent from '../../components/SupportAgent';
import ThemeToggle from '../../components/ThemeToggle';

export default function UserLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('user_type');
        const userName = localStorage.getItem('user_name');

        if (!token || userType !== 'youth') {
            router.push('/login');
            return;
        }

        setUser({ name: userName });
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        router.push('/login');
    };

    const navItems = [
        { href: '/user/profile', label: 'Profile', icon: 'P' },
        { href: '/user/tracker', label: 'Application Status', icon: 'T' },
    ];

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="user-app">
            <nav className="user-navbar">
                <div className="user-navbar-brand">
                    <span className="brand-logo">PF</span>
                    <span className="brand-text">PathFinder AI</span>
                </div>
                <div className="user-navbar-links">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`user-nav-link ${pathname === item.href ? 'active' : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
                <div className="user-navbar-right">
                    <span className="user-greeting">Hi, {user?.name?.split(' ')[0]}</span>
                    <ThemeToggle />
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        Logout
                    </button>
                </div>
            </nav>
            <main className="user-main">
                {children}
            </main>
            <AIChatWidget />
            <SupportAgent />
        </div>
    );
}
