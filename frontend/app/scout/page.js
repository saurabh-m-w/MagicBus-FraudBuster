'use client';
import { useState, useEffect } from 'react';
import { scoutAPI } from '../../lib/api';

export default function ScoutPage() {
    const [candidates, setCandidates] = useState([]);
    const [segments, setSegments] = useState(null);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                const [candidatesData, segmentsData, zonesData] = await Promise.all([
                    scoutAPI.getCandidates(filter),
                    scoutAPI.getSegments(),
                    scoutAPI.getZoneAnalysis()
                ]);
                setCandidates(candidatesData);
                setSegments(segmentsData);
                setZones(zonesData);
            } catch (error) {
                console.error('Failed to fetch SCOUT data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [filter]);

    const getScoreBadge = (score) => {
        if (score >= 80) return <span className="badge badge-success">High Potential</span>;
        if (score >= 50) return <span className="badge badge-warning">Medium</span>;
        return <span className="badge badge-danger">Needs Support</span>;
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">SCOUT - Predictive Targeting</h1>
                <p className="page-subtitle">AI-powered propensity scoring to identify high-potential candidates</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{segments?.total || 0}</div>
                    <div className="stat-label">Total Candidates</div>
                </div>
                <div className="stat-card" style={{ borderColor: 'var(--success)' }}>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>
                        {segments?.high_potential?.count || 0}
                    </div>
                    <div className="stat-label">High Potential (80+)</div>
                    <span className="stat-trend up">{segments?.high_potential?.percentage?.toFixed(1)}% of total</span>
                </div>
                <div className="stat-card" style={{ borderColor: 'var(--warning)' }}>
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>
                        {segments?.medium_potential?.count || 0}
                    </div>
                    <div className="stat-label">Medium Potential (50-79)</div>
                </div>
                <div className="stat-card" style={{ borderColor: 'var(--danger)' }}>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>
                        {segments?.needs_support?.count || 0}
                    </div>
                    <div className="stat-label">Needs Support (&lt;50)</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Candidate Pipeline</h2>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(Number(e.target.value))}
                            style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--surface-light)', color: 'var(--text)', border: 'none' }}
                        >
                            <option value={0}>All Candidates</option>
                            <option value={80}>High Potential Only</option>
                            <option value={50}>Medium+ Only</option>
                        </select>
                    </div>
                    <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Location</th>
                                    <th>SCOUT Score</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.slice(0, 20).map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{c.age}</td>
                                        <td>{c.location}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div className="progress-bar" style={{ width: '80px' }}>
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{
                                                            width: `${c.scout_score}%`,
                                                            background: c.scout_score >= 80 ? 'var(--success)' : c.scout_score >= 50 ? 'var(--warning)' : 'var(--danger)'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span>{c.scout_score?.toFixed(0)}</span>
                                            </div>
                                        </td>
                                        <td>{getScoreBadge(c.scout_score)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Zone Analysis</h2>
                    </div>
                    <div className="card-body">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Candidates</th>
                                    <th>Avg Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {zones.slice(0, 10).map((z, i) => (
                                    <tr key={i}>
                                        <td>{z.location}</td>
                                        <td>{z.candidate_count}</td>
                                        <td>
                                            <span className={`badge ${z.avg_scout_score >= 70 ? 'badge-success' : z.avg_scout_score >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                                                {z.avg_scout_score}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
