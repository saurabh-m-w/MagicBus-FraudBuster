'use client';
import { useState, useEffect } from 'react';
import { thriveAPI, whatsappAPI } from '../../lib/api';
import { StatCard, DataCard, BaseCard } from '../../components/cards';

export default function ThrivePage() {
    const [atRisk, setAtRisk] = useState([]);
    const [distribution, setDistribution] = useState(null);
    const [placementMetrics, setPlacementMetrics] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [selectedYouth, setSelectedYouth] = useState(null);
    const [jobMatches, setJobMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNudgeModal, setShowNudgeModal] = useState(false);
    const [nudgeTarget, setNudgeTarget] = useState(null);
    const [nudgeType, setNudgeType] = useState('motivational');
    const [customMessage, setCustomMessage] = useState('');
    const [sending, setSending] = useState(false);

    const nudgeTypes = [
        { id: 'motivational', label: 'Motivational', desc: 'Encourage continued participation' },
        { id: 'attendance', label: 'Attendance', desc: 'Address missed sessions' },
        { id: 'milestone', label: 'Milestone', desc: 'Celebrate achievements' },
        { id: 'job_opportunity', label: 'Job Alert', desc: 'Share job opportunities' }
    ];

    useEffect(() => {
        async function fetchData() {
            try {
                const [riskData, distData, placementData, jobsData] = await Promise.all([
                    thriveAPI.getAtRisk(30),
                    thriveAPI.getRiskDistribution(),
                    thriveAPI.getPlacementMetrics(),
                    thriveAPI.getJobs()
                ]);
                setAtRisk(riskData);
                setDistribution(distData);
                setPlacementMetrics(placementData);
                setJobs(jobsData);
            } catch (error) {
                console.error('Failed to fetch THRIVE data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleViewMatches = async (youthId, youthName) => {
        try {
            const matches = await thriveAPI.getJobMatches(youthId);
            setJobMatches(matches);
            setSelectedYouth(youthName);
        } catch (error) {
            console.error('Failed to fetch job matches:', error);
        }
    };

    const openNudgeModal = (youth) => {
        setNudgeTarget(youth);
        setNudgeType('motivational');
        setCustomMessage('');
        setShowNudgeModal(true);
    };

    const handleSendNudge = async () => {
        if (!nudgeTarget) return;
        
        setSending(true);
        try {
            const message = customMessage || null;
            await whatsappAPI.sendNudge(nudgeTarget.youth_id, nudgeType, message);
            alert(`Nudge sent to ${nudgeTarget.youth_name}`);
            setShowNudgeModal(false);
        } catch (error) {
            console.error('Failed to send nudge:', error);
            alert('Failed to send nudge');
        } finally {
            setSending(false);
        }
    };

    const getRiskColor = (level) => {
        const colors = {
            critical: 'var(--danger)',
            high: 'var(--warning)',
            medium: '#fbbf24',
            low: 'var(--success)'
        };
        return colors[level] || 'var(--text-muted)';
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">THRIVE - Retention and Placement</h1>
                <p className="page-subtitle">Predictive dropout prevention and AI-powered job matching</p>
            </div>

            <div className="cards-grid" style={{ marginBottom: '1.5rem' }}>
                <StatCard
                    value={distribution?.total_enrolled || 0}
                    label="Enrolled Youth"
                />
                <StatCard
                    value={(distribution?.distribution?.critical || 0) + (distribution?.distribution?.high || 0)}
                    label="High Risk"
                    trend="Need immediate attention"
                    trendDirection="down"
                    accentColor="var(--danger)"
                />
                <StatCard
                    value={placementMetrics?.total_placements || 0}
                    label="Job Placements"
                    accentColor="var(--success)"
                />
                <StatCard
                    value={`${placementMetrics?.success_rate || 0}%`}
                    label="90-Day Retention"
                />
            </div>

            <div className="cards-grid-2">
                <DataCard title="Risk Distribution">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        {Object.entries(distribution?.distribution || {}).map(([level, count]) => (
                            <div key={level} style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: getRiskColor(level),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 0.5rem',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: 'white'
                                }}>
                                    {count}
                                </div>
                                <div style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{level}</div>
                            </div>
                        ))}
                    </div>
                </DataCard>

                <DataCard title="Available Jobs" maxHeight="200px">
                    {jobs.slice(0, 5).map((job) => (
                        <BaseCard key={job.id} padding="small" style={{ marginBottom: '0.5rem', background: 'var(--surface-light)' }}>
                            <div style={{ fontWeight: 600 }}>{job.title}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                {job.company} | {job.salary_range}
                            </div>
                        </BaseCard>
                    ))}
                </DataCard>
            </div>

            <DataCard title="At-Risk Youth - Early Warning System" style={{ marginTop: '1.5rem' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Risk Level</th>
                            <th>Risk Factors</th>
                            <th>Recommendation</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {atRisk.slice(0, 10).map((youth) => (
                            <tr key={youth.youth_id}>
                                <td>{youth.youth_name}</td>
                                <td>
                                    <div className="risk-indicator">
                                        <span className={`risk-dot ${youth.risk_level}`}></span>
                                        <span style={{ textTransform: 'capitalize' }}>{youth.risk_level}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>({youth.risk_score}%)</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {youth.risk_factors.join(', ')}
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.875rem' }}>{youth.recommended_intervention}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                            onClick={() => openNudgeModal(youth)}
                                            disabled={sending}
                                        >
                                            Nudge
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                            onClick={() => handleViewMatches(youth.youth_id, youth.youth_name)}
                                        >
                                            Jobs
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataCard>

            {selectedYouth && (
                <DataCard 
                    title={`Job Matches for ${selectedYouth}`}
                    action={<button className="btn btn-secondary" onClick={() => setSelectedYouth(null)}>Close</button>}
                    style={{ marginTop: '1.5rem' }}
                >
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Job Title</th>
                                <th>Company</th>
                                <th>Match Score</th>
                                <th>Skills Matched</th>
                                <th>Skills Gap</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobMatches.map((match) => (
                                <tr key={match.job_id}>
                                    <td>{match.job_title}</td>
                                    <td>{match.company}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div className="progress-bar" style={{ width: '60px' }}>
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{
                                                        width: `${match.match_score}%`,
                                                        background: match.match_score >= 70 ? 'var(--success)' : 'var(--warning)'
                                                    }}
                                                ></div>
                                            </div>
                                            <span>{match.match_score}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        {match.skills_matched.map(s => (
                                            <span key={s} className="badge badge-success" style={{ marginRight: '0.25rem' }}>{s}</span>
                                        ))}
                                    </td>
                                    <td>
                                        {match.skills_gap.map(s => (
                                            <span key={s} className="badge badge-warning" style={{ marginRight: '0.25rem' }}>{s}</span>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DataCard>
            )}

            {showNudgeModal && nudgeTarget && (
                <div className="modal-overlay" onClick={() => setShowNudgeModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Send Nudge to {nudgeTarget.youth_name}</h3>
                            <button className="btn btn-secondary" onClick={() => setShowNudgeModal(false)}>Close</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Nudge Type</label>
                                <div className="segment-buttons">
                                    {nudgeTypes.map(type => (
                                        <button
                                            key={type.id}
                                            className={`segment-btn ${nudgeType === type.id ? 'active' : ''}`}
                                            onClick={() => setNudgeType(type.id)}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    {nudgeTypes.find(t => t.id === nudgeType)?.desc}
                                </p>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Custom Message (Optional)</label>
                                <textarea
                                    className="form-input"
                                    value={customMessage}
                                    onChange={e => setCustomMessage(e.target.value)}
                                    placeholder="Leave blank to use template message..."
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>Risk Information</label>
                                <div className="message-preview">
                                    <strong>Risk Level:</strong> {nudgeTarget.risk_level} ({nudgeTarget.risk_score}%){'\n'}
                                    <strong>Factors:</strong> {nudgeTarget.risk_factors.join(', ')}{'\n'}
                                    <strong>Recommended:</strong> {nudgeTarget.recommended_intervention}
                                </div>
                            </div>
                            <button 
                                className="btn btn-primary" 
                                style={{ width: '100%', marginTop: '1rem' }}
                                onClick={handleSendNudge}
                                disabled={sending}
                            >
                                {sending ? 'Sending...' : 'Send WhatsApp Nudge'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
