'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '../../components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LoginPage() {
    const router = useRouter();
    const [loginType, setLoginType] = useState('youth');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = loginType === 'admin' ? '/auth/admin/login' : '/auth/youth/login';
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Login failed');
            }

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user_type', data.user_type);
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('user_name', data.name);

            if (data.user_type === 'admin') {
                router.push('/');
            } else {
                router.push('/user/profile');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-theme-toggle">
                <ThemeToggle />
            </div>
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">PathFinder AI</h1>
                    <p className="auth-subtitle">Youth Mobilisation Platform</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${loginType === 'youth' ? 'active' : ''}`}
                        onClick={() => setLoginType('youth')}
                    >
                        Youth Login
                    </button>
                    <button
                        className={`auth-tab ${loginType === 'admin' ? 'active' : ''}`}
                        onClick={() => setLoginType('admin')}
                    >
                        Admin Login
                    </button>
                </div>

                <form onSubmit={handleLogin} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {loginType === 'youth' && (
                    <div className="auth-footer">
                        <p>Don't have an account? <Link href="/signup">Sign Up</Link></p>
                    </div>
                )}

                {loginType === 'admin' && (
                    <div className="auth-hint">
                        <p>Demo: admin@magicbus.org / admin123</p>
                    </div>
                )}
            </div>
        </div>
    );
}
