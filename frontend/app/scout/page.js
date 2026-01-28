'use client';
import { useState, useEffect } from 'react';
import { scoutAPI } from '../../lib/api';
import { StatCard, DataCard } from '../../components/cards';

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

            <div className="cards-grid" style={{ marginBottom: '1.5rem' }}>
                <StatCard
                    value={segments?.total || 0}
                    label="Total Candidates"
                />
                <StatCard
                    value={segments?.high_potential?.count || 0}
                    label="High Potential (80+)"
                    trend={`${segments?.high_potential?.percentage?.toFixed(1)}% of total`}
                    trendDirection="up"
                    accentColor="var(--success)"
                />
                <StatCard
                    value={segments?.medium_potential?.count || 0}
                    label="Medium Potential (50-79)"
                    accentColor="var(--warning)"
                />
                <StatCard
                    value={segments?.needs_support?.count || 0}
                    label="Needs Support (<50)"
                    accentColor="var(--danger)"
                />
            </div>

            <div className="cards-grid-2">
                <DataCard 
                    title="Candidate Pipeline"
                    action={
                        <select
                            value={filter}
                            onChange={(e) => setFilter(Number(e.target.value))}
                            style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--surface-light)', color: 'var(--text)', border: 'none' }}
                        >
                            <option value={0}>All Candidates</option>
                            <option value={80}>High Potential Only</option>
                            <option value={50}>Medium+ Only</option>
                        </select>
                    }
                    maxHeight="400px"
                >
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
                </DataCard>

                <DataCard title="Zone Analysis">
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
                </DataCard>
            </div>
        </>
    );
}
