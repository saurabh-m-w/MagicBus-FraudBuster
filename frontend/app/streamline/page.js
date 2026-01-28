'use client';
import { useState, useEffect } from 'react';
import { streamlineAPI, whatsappAPI } from '../../lib/api';

export default function StreamlinePage() {
    const [pipeline, setPipeline] = useState({});
    const [metrics, setMetrics] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('interested');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const statusLabels = {
        discovered: 'Discovered',
        interested: 'Interested',
        documents_pending: 'Docs Pending',
        documents_submitted: 'Docs Submitted',
        verified: 'Verified',
        enrolled: 'Enrolled',
        dropped: 'Dropped'
    };

    const statusMessageMap = {
        discovered: 'welcome',
        interested: 'documents',
        documents_pending: 'reminder',
        documents_submitted: 'reminder',
        verified: 'enrolled'
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const [pipelineData, metricsData] = await Promise.all([
                    streamlineAPI.getPipeline(),
                    streamlineAPI.getMetrics()
                ]);
                setPipeline(pipelineData);
                setMetrics(metricsData);
            } catch (error) {
                console.error('Failed to fetch STREAMLINE data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        async function fetchCandidates() {
            try {
                const data = await streamlineAPI.getCandidatesByStatus(selectedStatus);
                setCandidates(data);
            } catch (error) {
                console.error('Failed to fetch candidates:', error);
            }
        }
        fetchCandidates();
    }, [selectedStatus]);

    const handleStatusUpdate = async (youthId, newStatus) => {
        try {
            await streamlineAPI.updateStatus(youthId, newStatus);
            const updated = await streamlineAPI.getCandidatesByStatus(selectedStatus);
            setCandidates(updated);
            const newPipeline = await streamlineAPI.getPipeline();
            setPipeline(newPipeline);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleSendWhatsApp = async (youthId, messageType) => {
        setSending(true);
        try {
            const result = await whatsappAPI.sendOnboarding(youthId, messageType);
            alert(`Message sent: ${result.status}`);
        } catch (error) {
            console.error('Failed to send WhatsApp:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">STREAMLINE - Automated Onboarding</h1>
                <p className="page-subtitle">Track and manage the youth onboarding pipeline</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{metrics?.total_candidates || 0}</div>
                    <div className="stat-label">Total Candidates</div>
                </div>
                <div className="stat-card" style={{ borderColor: 'var(--success)' }}>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>
                        {metrics?.enrolled || 0}
                    </div>
                    <div className="stat-label">Enrolled</div>
                    <span className="stat-trend up">{metrics?.enrollment_rate?.toFixed(1)}% rate</span>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{metrics?.in_progress || 0}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{metrics?.avg_onboarding_days || 0}</div>
                    <div className="stat-label">Avg. Days to Enroll</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Onboarding Pipeline</h2>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {Object.entries(statusLabels).filter(([k]) => k !== 'dropped').map(([status, label]) => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className={`btn ${selectedStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ position: 'relative' }}
                            >
                                {label}
                                <span style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {pipeline[status] || 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Candidates - {statusLabels[selectedStatus]}</h2>
                </div>
                <div className="card-body">
                    {candidates.length === 0 ? (
                        <div className="empty-state">No candidates in this stage</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Location</th>
                                    <th>Channel</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.slice(0, 20).map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{c.phone}</td>
                                        <td>{c.location}</td>
                                        <td><span className="badge badge-primary">{c.source_channel}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {statusMessageMap[selectedStatus] && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                        onClick={() => handleSendWhatsApp(c.id, statusMessageMap[selectedStatus])}
                                                        disabled={sending}
                                                    >
                                                        Send WA
                                                    </button>
                                                )}
                                                {selectedStatus !== 'enrolled' && selectedStatus !== 'dropped' && (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                        onClick={() => {
                                                            const statuses = Object.keys(statusLabels);
                                                            const currentIdx = statuses.indexOf(selectedStatus);
                                                            if (currentIdx < statuses.length - 2) {
                                                                handleStatusUpdate(c.id, statuses[currentIdx + 1]);
                                                            }
                                                        }}
                                                    >
                                                        Advance
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
