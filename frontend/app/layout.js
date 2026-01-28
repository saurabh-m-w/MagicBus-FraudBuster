'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isUserPage = pathname.startsWith('/user');

  useEffect(() => {
    if (isAuthPage || isUserPage) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('user_type');
    const name = localStorage.getItem('user_name');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userType !== 'admin') {
      router.push('/user/profile');
      return;
    }

    setIsAdmin(true);
    setUserName(name || 'Admin');
    setLoading(false);
  }, [pathname, router, isAuthPage, isUserPage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: 'D' },
    { href: '/scout', label: 'SCOUT', icon: 'S' },
    { href: '/streamline', label: 'STREAMLINE', icon: 'L' },
    { href: '/amplify', label: 'AMPLIFY', icon: 'A' },
    { href: '/thrive', label: 'THRIVE', icon: 'T' },
    { href: '/marketing', label: 'Marketing', icon: 'M' },
    { href: '/verification', label: 'Verification', icon: 'V' },
  ];

  if (isAuthPage || isUserPage) {
    return (
      <html lang="en">
        <head>
          <title>PathFinder AI - Youth Mobilisation Platform</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="en">
        <head>
          <title>PathFinder AI</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body>
          <div className="loading-screen">
            <div className="spinner"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>PathFinder AI - Admin Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="logo">PathFinder AI</div>

            <nav className="nav-section">
              <div className="nav-section-title">Platform</div>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                >
                  <span className="nav-icon-letter">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="nav-section">
              <div className="nav-section-title">Resources</div>
              <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="nav-link">
                <span className="nav-icon-letter">?</span>
                <span>API Docs</span>
              </a>
            </div>

            <div className="sidebar-footer">
              <div className="admin-info">
                <span className="admin-name">{userName}</span>
                <ThemeToggle />
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
              <div className="sidebar-badge">Magic Bus</div>
              <div className="sidebar-version">v1.0.0</div>
            </div>
          </aside>

          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
