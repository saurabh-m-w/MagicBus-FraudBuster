'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BaseCard, DataCard } from '../../../components/cards';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function UserTrackerPage() {
    const router = useRouter();
    const [tracker, setTracker] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const [trackerRes, notifRes] = await Promise.all([
                fetch(`${API_BASE}/user/tracker`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE}/user/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!trackerRes.ok) {
                if (trackerRes.status === 401) {
                    router.push('/login');
                    return;
                }
                throw new Error('Failed to fetch data');
            }

            const trackerData = await trackerRes.json();
            const notifData = await notifRes.json();

            setTracker(trackerData);
            setNotifications(notifData.notifications || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="tracker-page">
            <div className="tracker-header">
                <h1>Application Status</h1>
                <p>Track your progress through the Magic Bus programme</p>
            </div>

            {notifications.length > 0 && (
                <div className="notifications-section">
                    {notifications.map((notif, idx) => (
                        <BaseCard key={idx} padding="small" className={`notification-card-v2 ${notif.type}`}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="notif-icon">
                                    {notif.type === 'action_required' && '!'}
                                    {notif.type === 'info' && 'i'}
                                    {notif.type === 'success' && '✓'}
                                </div>
                                <div className="notif-content" style={{ flex: 1 }}>
                                    <h4>{notif.title}</h4>
                                    <p>{notif.message}</p>
                                </div>
                                {notif.type === 'action_required' && (
                                    <Link href="/user/profile" className="btn btn-sm btn-primary">
                                        Take Action
                                    </Link>
                                )}
                            </div>
                        </BaseCard>
                    ))}
                </div>
            )}

            <div className="progress-overview">
                <BaseCard className="progress-card-v2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div className="progress-circle">
                            <svg viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="var(--surface-light)"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="var(--primary)"
                                    strokeWidth="8"
                                    strokeDasharray={`${tracker?.progress_percentage * 2.83} 283`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="progress-text">
                                <span className="progress-value">{tracker?.progress_percentage}%</span>
                                <span className="progress-label">Complete</span>
                            </div>
                        </div>
                        <div className="progress-info">
                            <h3>Stage {tracker?.current_stage} of {tracker?.total_stages}</h3>
                            <p className="current-status">{tracker?.stages?.find(s => s.status === 'current')?.label || 'Processing'}</p>
                        </div>
                    </div>
                </BaseCard>
            </div>

            <DataCard title="Application Journey" style={{ marginTop: '1.5rem' }}>
                <div className="timeline">
                    {tracker?.stages?.map((stage, idx) => (
                        <div key={stage.id} className={`timeline-item ${stage.status}`}>
                            <div className="timeline-marker">
                                {stage.status === 'completed' && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M5 12l5 5L20 7" />
                                    </svg>
                                )}
                                {stage.status === 'current' && <div className="pulse-dot"></div>}
                                {stage.status === 'pending' && <span>{stage.order}</span>}
                            </div>
                            <div className="timeline-content">
                                <h4>{stage.label}</h4>
                                <p>{stage.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </DataCard>

            <div className="tracker-footer">
                <BaseCard className="help-card-v2" style={{ textAlign: 'center' }}>
                    <h3>Need Help?</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>If you have any questions about your application, contact our support team.</p>
                    <div className="help-contacts">
                        <a href="tel:+918888888888" className="help-link">
                            Call: +91 8888 888 888
                        </a>
                        <a href="mailto:support@magicbus.org" className="help-link">
                            Email: support@magicbus.org
                        </a>
                    </div>
                </BaseCard>
            </div>
        </div>
    );
}
