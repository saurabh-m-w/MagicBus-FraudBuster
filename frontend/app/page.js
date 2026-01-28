'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardAPI } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [pillarSummary, setPillarSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, funnelData, pillarData] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getFunnel(),
          dashboardAPI.getPillarSummary()
        ]);
        setStats(statsData);
        setFunnel(funnelData);
        setPillarSummary(pillarData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const maxFunnelCount = Math.max(...funnel.map(f => f.count), 1);

  const pillarColors = {
    SCOUT: '#ef4444',
    STREAMLINE: '#f59e0b',
    AMPLIFY: '#3b82f6',
    THRIVE: '#10b981'
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">PathFinder AI - Youth Mobilisation Platform for Magic Bus</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_candidates || 0}</div>
          <div className="stat-label">Total Candidates</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.enrolled_count || 0}</div>
          <div className="stat-label">Enrolled</div>
          <span className="stat-trend up">Active in programme</span>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.avg_onboarding_days || 0}</div>
          <div className="stat-label">Avg. Onboarding Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.high_risk_count || 0}</div>
          <div className="stat-label">At-Risk Youth</div>
          <span className="stat-trend down">Needs intervention</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">4 Pillars Overview</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {pillarSummary && Object.values(pillarSummary).map((pillar, i) => (
                <Link
                  href={`/${pillar.title.toLowerCase()}`}
                  key={i}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="pillar-card">
                    <div 
                      className="pillar-icon-badge"
                      style={{ background: pillarColors[pillar.title] }}
                    >
                      {pillar.title.charAt(0)}
                    </div>
                    <div className="pillar-title">{pillar.title}</div>
                    <div className="pillar-metric">{pillar.metric}</div>
                    <div className="pillar-desc">{pillar.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Conversion Funnel</h2>
          </div>
          <div className="card-body">
            <div className="funnel">
              {funnel.map((stage, i) => (
                <div className="funnel-stage" key={i}>
                  <div className="funnel-label">{stage.stage}</div>
                  <div
                    className="funnel-bar"
                    style={{ width: `${(stage.count / maxFunnelCount) * 100}%`, minWidth: '40px' }}
                  >
                    {stage.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Key Metrics</h2>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            <div>
              <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Dropout Rate</div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${stats?.dropout_rate || 0}%`, background: 'var(--danger)' }}></div>
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>{stats?.dropout_rate || 0}%</div>
            </div>
            <div>
              <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Placement Rate</div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${stats?.placement_rate || 0}%`, background: 'var(--success)' }}></div>
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>{stats?.placement_rate || 0}%</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
