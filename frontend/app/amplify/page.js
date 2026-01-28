'use client';
import { useState, useEffect } from 'react';
import { amplifyAPI, whatsappAPI } from '../../lib/api';
import { StatCard, DataCard } from '../../components/cards';

export default function AmplifyPage() {
    const [channelPerformance, setChannelPerformance] = useState([]);
    const [attribution, setAttribution] = useState(null);
    const [budgetRec, setBudgetRec] = useState(null);
    const [budget, setBudget] = useState(100000);
    const [loading, setLoading] = useState(true);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [campaignForm, setCampaignForm] = useState({
        name: '',
        message: '',
        segment: 'all',
        location: ''
    });
    const [campaignResult, setCampaignResult] = useState(null);
    const [sending, setSending] = useState(false);

    const segments = [
        { id: 'all', label: 'All Candidates' },
        { id: 'high_potential', label: 'High Potential (80+)' },
        { id: 'enrolled', label: 'Enrolled Youth' },
        { id: 'at_risk', label: 'At-Risk Youth' }
    ];

    useEffect(() => {
        async function fetchData() {
            try {
                const [perfData, attrData, budgetData] = await Promise.all([
                    amplifyAPI.getChannelPerformance(),
                    amplifyAPI.getAttribution(),
                    amplifyAPI.getBudgetRecommendation(budget)
                ]);
                setChannelPerformance(perfData);
                setAttribution(attrData);
                setBudgetRec(budgetData);
            } catch (error) {
                console.error('Failed to fetch AMPLIFY data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [budget]);

    const handleRunCampaign = async () => {
        if (!campaignForm.name || !campaignForm.message) {
            alert('Please fill in campaign name and message');
            return;
        }
        setSending(true);
        try {
            const result = await whatsappAPI.runCampaign(
                campaignForm.name,
                campaignForm.message,
                campaignForm.segment,
                campaignForm.location || null
            );
            setCampaignResult(result);
        } catch (error) {
            console.error('Campaign failed:', error);
            alert('Failed to run campaign');
        } finally {
            setSending(false);
        }
    };

    const getROIBar = (score) => {
        const percentage = Math.min(100, (score / 5) * 100);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="progress-bar" style={{ width: '60px' }}>
                    <div 
                        className="progress-bar-fill" 
                        style={{ 
                            width: `${percentage}%`,
                            background: score >= 4 ? 'var(--success)' : score >= 2 ? 'var(--warning)' : 'var(--danger)'
                        }}
                    ></div>
                </div>
                <span style={{ fontSize: '0.75rem' }}>{score.toFixed(1)}</span>
            </div>
        );
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    const maxReach = Math.max(...channelPerformance.map(c => c.reach), 1);

    return (
        <>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-title">AMPLIFY - Channel Optimization</h1>
                        <p className="page-subtitle">AI-powered channel performance analysis and budget optimization</p>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => { setShowCampaignModal(true); setCampaignResult(null); }}
                    >
                        + Launch Campaign
                    </button>
                </div>
            </div>

            <div className="cards-grid" style={{ marginBottom: '1.5rem' }}>
                <StatCard
                    value={attribution?.total_conversions || 0}
                    label="Total Conversions"
                />
                <StatCard
                    value={channelPerformance.length}
                    label="Active Channels"
                />
                <StatCard
                    value={channelPerformance[0]?.channel?.replace('_', ' ') || 'N/A'}
                    label="Top Performing"
                    trend="Highest ROI"
                    trendDirection="up"
                />
                <StatCard
                    value={`₹${budget.toLocaleString()}`}
                    label="Budget Allocation"
                />
            </div>

            <div className="cards-grid-2">
                <DataCard title="Channel Performance">
                    {channelPerformance.map((channel) => (
                        <div className="channel-bar" key={channel.channel}>
                            <div className="channel-name" style={{ textTransform: 'capitalize' }}>
                                {channel.channel.replace('_', ' ')}
                            </div>
                            <div className="channel-progress">
                                <div
                                    className="channel-fill"
                                    style={{ width: `${(channel.reach / maxReach) * 100}%` }}
                                >
                                    {channel.conversions}
                                </div>
                            </div>
                            <div className="channel-roi">
                                {getROIBar(channel.roi_score)}
                            </div>
                        </div>
                    ))}
                </DataCard>

                <DataCard title="Conversion Attribution">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Channel</th>
                                <th>Conversions</th>
                                <th>Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attribution?.attribution?.map((a) => (
                                <tr key={a.channel}>
                                    <td style={{ textTransform: 'capitalize' }}>{a.channel.replace('_', ' ')}</td>
                                    <td>{a.conversions}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div className="progress-bar" style={{ width: '80px' }}>
                                                <div className="progress-bar-fill" style={{ width: `${a.percentage}%` }}></div>
                                            </div>
                                            <span>{a.percentage}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DataCard>
            </div>

            <DataCard 
                title="AI Budget Recommendation"
                action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Budget:</span>
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className="form-input"
                            style={{ width: '140px', padding: '0.5rem' }}
                        />
                    </div>
                }
                style={{ marginTop: '1.5rem' }}
            >
                <table className="table">
                    <thead>
                        <tr>
                            <th>Channel</th>
                            <th>ROI Score</th>
                            <th>Recommended Budget</th>
                            <th>Expected Conversions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {budgetRec?.recommendations?.map((rec) => (
                            <tr key={rec.channel}>
                                <td style={{ textTransform: 'capitalize' }}>{rec.channel.replace('_', ' ')}</td>
                                <td>{getROIBar(rec.current_roi_score)}</td>
                                <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                                    ₹{rec.recommended_budget.toLocaleString()}
                                </td>
                                <td>{rec.expected_conversions}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataCard>

            {showCampaignModal && (
                <div className="modal-overlay" onClick={() => setShowCampaignModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Launch WhatsApp Campaign</h3>
                            <button className="btn btn-secondary" onClick={() => setShowCampaignModal(false)}>Close</button>
                        </div>
                        <div className="modal-body">
                            {!campaignResult ? (
                                <div className="campaign-form">
                                    <div className="form-group">
                                        <label>Campaign Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={campaignForm.name}
                                            onChange={e => setCampaignForm({...campaignForm, name: e.target.value})}
                                            placeholder="e.g., January Enrollment Drive"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Target Segment</label>
                                        <div className="segment-buttons">
                                            {segments.map(seg => (
                                                <button
                                                    key={seg.id}
                                                    className={`segment-btn ${campaignForm.segment === seg.id ? 'active' : ''}`}
                                                    onClick={() => setCampaignForm({...campaignForm, segment: seg.id})}
                                                >
                                                    {seg.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Location Filter (Optional)</label>
                                        <select
                                            className="form-input"
                                            value={campaignForm.location}
                                            onChange={e => setCampaignForm({...campaignForm, location: e.target.value})}
                                        >
                                            <option value="">All Locations</option>
                                            <option value="Mumbai">Mumbai</option>
                                            <option value="Delhi">Delhi</option>
                                            <option value="Bangalore">Bangalore</option>
                                            <option value="Hyderabad">Hyderabad</option>
                                            <option value="Pune">Pune</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Message (use {'{name}'} for personalization)</label>
                                        <textarea
                                            className="form-input"
                                            value={campaignForm.message}
                                            onChange={e => setCampaignForm({...campaignForm, message: e.target.value})}
                                            placeholder="Hi {name}, we have exciting opportunities waiting for you at Magic Bus..."
                                            rows={4}
                                        />
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%' }}
                                        onClick={handleRunCampaign}
                                        disabled={sending}
                                    >
                                        {sending ? 'Sending...' : 'Launch Campaign'}
                                    </button>
                                </div>
                            ) : (
                                <div className="conversation-result">
                                    <div className="result-header">
                                        <span className="badge badge-success">Campaign Complete</span>
                                    </div>
                                    <div style={{ padding: '1rem 0' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{campaignResult.total}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{campaignResult.success}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sent</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{campaignResult.failed}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Failed</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="result-footer">
                                        <p>Campaign: {campaignForm.name}</p>
                                        <p>Segment: {segments.find(s => s.id === campaignForm.segment)?.label}</p>
                                    </div>
                                    <button 
                                        className="btn btn-secondary" 
                                        style={{ width: '100%', marginTop: '1rem' }}
                                        onClick={() => {
                                            setCampaignResult(null);
                                            setCampaignForm({ name: '', message: '', segment: 'all', location: '' });
                                        }}
                                    >
                                        New Campaign
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
