'use client';
import { useState, useEffect, useMemo } from 'react';
import { amplifyAPI, whatsappAPI } from '../../lib/api';
import { StatCard, DataCard } from '../../components/cards';

// Budget Allocation Pie Chart Component
function BudgetAllocationPieChart({ recommendations, totalBudget }) {
    const [hoveredSlice, setHoveredSlice] = useState(null);
    
    const colors = [
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16'
    ];
    
    // Calculate pie slices
    let cumulativeAngle = 0;
    const slices = recommendations?.map((rec, index) => {
        const percentage = rec.budget_percentage || (rec.recommended_budget / totalBudget * 100);
        const angle = (percentage / 100) * 360;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        
        return {
            ...rec,
            percentage,
            startAngle,
            endAngle: cumulativeAngle,
            color: colors[index % colors.length]
        };
    }) || [];
    
    // SVG path for pie slice
    const getSlicePath = (startAngle, endAngle, radius = 90, innerRadius = 45) => {
        if (endAngle - startAngle >= 359.9) {
            // Full circle
            return `M 120 ${120 - radius} A ${radius} ${radius} 0 1 1 120 ${120 + radius} A ${radius} ${radius} 0 1 1 120 ${120 - radius} Z M 120 ${120 - innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 120 ${120 + innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 120 ${120 - innerRadius} Z`;
        }
        
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        
        const x1 = 120 + radius * Math.cos(startRad);
        const y1 = 120 + radius * Math.sin(startRad);
        const x2 = 120 + radius * Math.cos(endRad);
        const y2 = 120 + radius * Math.sin(endRad);
        
        const x3 = 120 + innerRadius * Math.cos(endRad);
        const y3 = 120 + innerRadius * Math.sin(endRad);
        const x4 = 120 + innerRadius * Math.cos(startRad);
        const y4 = 120 + innerRadius * Math.sin(startRad);
        
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        
        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    };
    
    const formatCurrency = (value) => {
        if (value >= 100000) return `₹${(value/100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value/1000).toFixed(1)}K`;
        return `₹${value.toFixed(0)}`;
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Pie Chart */}
            <div style={{ position: 'relative' }}>
                <svg width="240" height="240" viewBox="0 0 240 240">
                    {slices.map((slice, index) => (
                        <path
                            key={index}
                            d={getSlicePath(slice.startAngle, slice.endAngle)}
                            fill={slice.color}
                            stroke="var(--surface)"
                            strokeWidth="2"
                            style={{ 
                                cursor: 'pointer',
                                transition: 'transform 0.2s, filter 0.2s, opacity 0.2s',
                                transformOrigin: '120px 120px',
                                transform: hoveredSlice?.channel === slice.channel ? 'scale(1.08)' : 'scale(1)',
                                filter: hoveredSlice?.channel === slice.channel ? 'brightness(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'brightness(1)',
                                opacity: hoveredSlice && hoveredSlice.channel !== slice.channel ? 0.6 : 1
                            }}
                            onMouseEnter={() => setHoveredSlice(slice)}
                            onMouseLeave={() => setHoveredSlice(null)}
                        />
                    ))}
                    {/* Center text */}
                    <text x="120" y="110" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="500">
                        Total
                    </text>
                    <text x="120" y="135" textAnchor="middle" fill="var(--text)" fontSize="20" fontWeight="bold">
                        {formatCurrency(totalBudget)}
                    </text>
                </svg>
                
                {/* Hover tooltip */}
                {hoveredSlice && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'var(--surface)',
                        border: '2px solid ' + hoveredSlice.color,
                        borderRadius: '12px',
                        padding: '1rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                        zIndex: 10,
                        minWidth: '180px',
                        textAlign: 'center',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ fontWeight: '700', fontSize: '1rem', textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                            {hoveredSlice.channel.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: hoveredSlice.color }}>
                            ₹{hoveredSlice.recommended_budget.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {hoveredSlice.percentage.toFixed(1)}% of budget
                        </div>
                        <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--success)', 
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '4px'
                        }}>
                            ~{hoveredSlice.expected_conversions} expected conversions
                        </div>
                    </div>
                )}
            </div>
            
            {/* Legend */}
            <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {slices.map((slice, index) => (
                        <div 
                            key={index}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.75rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '0.5rem',
                                background: hoveredSlice?.channel === slice.channel ? 'var(--surface-light)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: hoveredSlice?.channel === slice.channel ? `1px solid ${slice.color}` : '1px solid transparent'
                            }}
                            onMouseEnter={() => setHoveredSlice(slice)}
                            onMouseLeave={() => setHoveredSlice(null)}
                        >
                            <div style={{ 
                                width: '14px', 
                                height: '14px', 
                                borderRadius: '4px',
                                background: slice.color,
                                flexShrink: 0
                            }} />
                            <span style={{ 
                                flex: 1, 
                                fontSize: '0.875rem',
                                textTransform: 'capitalize' 
                            }}>
                                {slice.channel.replace('_', ' ')}
                            </span>
                            <span style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: '600',
                                color: slice.color
                            }}>
                                ₹{(slice.recommended_budget / 1000).toFixed(1)}K
                            </span>
                            <span style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-secondary)',
                                width: '45px',
                                textAlign: 'right'
                            }}>
                                {slice.percentage.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

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
                            <th>Allocation %</th>
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
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div className="progress-bar" style={{ width: '60px' }}>
                                            <div 
                                                className="progress-bar-fill" 
                                                style={{ 
                                                    width: `${rec.budget_percentage || 0}%`,
                                                    background: 'var(--primary)'
                                                }}
                                            ></div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem' }}>{rec.budget_percentage?.toFixed(1) || 0}%</span>
                                    </div>
                                </td>
                                <td>{rec.expected_conversions}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataCard>

            <DataCard 
                title="Budget Allocation Visualization"
                subtitle="Hover over segments to see detailed breakdown"
                style={{ marginTop: '1.5rem' }}
            >
                <BudgetAllocationPieChart 
                    recommendations={budgetRec?.recommendations} 
                    totalBudget={budget} 
                />
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
