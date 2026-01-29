'use client';
import { useState, useEffect, useMemo } from 'react';
import { scoutAPI } from '../../lib/api';
import { StatCard, DataCard } from '../../components/cards';

// State-wise Pie Chart Component
function StateWisePieChart({ zones }) {
    const [hoveredState, setHoveredState] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Process zones to group by state
    const stateData = useMemo(() => {
        const stateMap = {};
        
        zones.forEach(zone => {
            // Extract state from location (format: "City - Area" or just "City")
            const location = zone.location || '';
            const parts = location.split(' - ');
            const city = parts[0];
            
            // Map cities to states (Indian cities)
            const cityStateMap = {
                'Ahmedabad': 'Gujarat',
                'Bangalore': 'Karnataka',
                'Chennai': 'Tamil Nadu',
                'Delhi': 'Delhi',
                'Hyderabad': 'Telangana',
                'Jaipur': 'Rajasthan',
                'Kolkata': 'West Bengal',
                'Mumbai': 'Maharashtra',
                'Pune': 'Maharashtra',
                'Lucknow': 'Uttar Pradesh',
                'Patna': 'Bihar',
                'Bhopal': 'Madhya Pradesh',
                'Indore': 'Madhya Pradesh',
                'Surat': 'Gujarat',
                'Nagpur': 'Maharashtra',
                'Vizag': 'Andhra Pradesh',
                'Kochi': 'Kerala',
                'Chandigarh': 'Punjab',
                'Coimbatore': 'Tamil Nadu',
                'Mysore': 'Karnataka'
            };
            
            const state = cityStateMap[city] || 'Other';
            
            if (!stateMap[state]) {
                stateMap[state] = {
                    state,
                    totalCandidates: 0,
                    totalScore: 0,
                    cities: []
                };
            }
            
            stateMap[state].totalCandidates += zone.candidate_count;
            stateMap[state].totalScore += zone.avg_scout_score * zone.candidate_count;
            stateMap[state].cities.push({
                name: location,
                candidates: zone.candidate_count,
                avgScore: zone.avg_scout_score
            });
        });
        
        // Calculate average and sort
        return Object.values(stateMap)
            .map(s => ({
                ...s,
                avgScore: s.totalCandidates > 0 ? (s.totalScore / s.totalCandidates).toFixed(1) : 0
            }))
            .sort((a, b) => b.totalCandidates - a.totalCandidates);
    }, [zones]);

    const total = stateData.reduce((sum, s) => sum + s.totalCandidates, 0);
    
    // Colors for pie chart
    const colors = [
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];

    // Calculate pie slices
    let cumulativeAngle = 0;
    const slices = stateData.map((state, index) => {
        const percentage = total > 0 ? (state.totalCandidates / total) * 100 : 0;
        const angle = (percentage / 100) * 360;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        
        return {
            ...state,
            percentage,
            startAngle,
            endAngle: cumulativeAngle,
            color: colors[index % colors.length]
        };
    });

    // SVG path for pie slice
    const getSlicePath = (startAngle, endAngle, radius = 100, innerRadius = 50) => {
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

    const handleMouseMove = (e, state) => {
        const rect = e.currentTarget.closest('.pie-chart-container').getBoundingClientRect();
        setTooltipPosition({
            x: e.clientX - rect.left + 10,
            y: e.clientY - rect.top - 10
        });
        setHoveredState(state);
    };

    return (
        <div className="pie-chart-container" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Pie Chart SVG */}
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
                                    transition: 'transform 0.2s, filter 0.2s',
                                    transformOrigin: '120px 120px',
                                    transform: hoveredState?.state === slice.state ? 'scale(1.05)' : 'scale(1)',
                                    filter: hoveredState?.state === slice.state ? 'brightness(1.2)' : 'brightness(1)'
                                }}
                                onMouseMove={(e) => handleMouseMove(e, slice)}
                                onMouseLeave={() => setHoveredState(null)}
                            />
                        ))}
                        {/* Center text */}
                        <text x="120" y="115" textAnchor="middle" fill="var(--text)" fontSize="24" fontWeight="bold">
                            {total}
                        </text>
                        <text x="120" y="135" textAnchor="middle" fill="var(--text-secondary)" fontSize="12">
                            Total
                        </text>
                    </svg>
                </div>

                {/* Legend */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {slices.slice(0, 8).map((slice, index) => (
                            <div 
                                key={index}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.75rem',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    background: hoveredState?.state === slice.state ? 'var(--surface-light)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={() => setHoveredState(slice)}
                                onMouseLeave={() => setHoveredState(null)}
                            >
                                <div style={{ 
                                    width: '12px', 
                                    height: '12px', 
                                    borderRadius: '3px',
                                    background: slice.color,
                                    flexShrink: 0
                                }} />
                                <span style={{ flex: 1, fontSize: '0.875rem' }}>{slice.state}</span>
                                <span style={{ 
                                    fontSize: '0.875rem', 
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {slice.totalCandidates}
                                </span>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--text-secondary)',
                                    width: '40px',
                                    textAlign: 'right'
                                }}>
                                    {slice.percentage.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredState && (
                <div 
                    style={{
                        position: 'absolute',
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                        zIndex: 1000,
                        minWidth: '220px',
                        pointerEvents: 'none'
                    }}
                >
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid var(--border)'
                    }}>
                        <div style={{ 
                            width: '14px', 
                            height: '14px', 
                            borderRadius: '4px',
                            background: hoveredState.color 
                        }} />
                        <span style={{ fontWeight: '700', fontSize: '1rem' }}>{hoveredState.state}</span>
                    </div>
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Candidates</span>
                            <span style={{ fontWeight: '600' }}>{hoveredState.totalCandidates}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Avg Score</span>
                            <span style={{ 
                                fontWeight: '600',
                                color: hoveredState.avgScore >= 70 ? 'var(--success)' : hoveredState.avgScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                            }}>
                                {hoveredState.avgScore}
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        City Breakdown:
                    </div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {hoveredState.cities.map((city, i) => (
                            <div 
                                key={i} 
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.35rem 0',
                                    borderBottom: i < hoveredState.cities.length - 1 ? '1px solid var(--border)' : 'none'
                                }}
                            >
                                <span style={{ fontSize: '0.8rem' }}>{city.name}</span>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <span style={{ 
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {city.candidates} candidates
                                    </span>
                                    <span style={{ 
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px',
                                        background: city.avgScore >= 70 ? 'rgba(16, 185, 129, 0.2)' : city.avgScore >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: city.avgScore >= 70 ? 'var(--success)' : city.avgScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                                    }}>
                                        {city.avgScore}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <DataCard title="Zone Analysis" maxHeight="250px">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Candidates</th>
                                    <th>Avg Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {zones.slice(0, 6).map((z, i) => (
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

                    <DataCard title="State-wise Distribution" subtitle="Hover over states to see city breakdown">
                        <StateWisePieChart zones={zones} />
                    </DataCard>
                </div>
            </div>
        </>
    );
}
