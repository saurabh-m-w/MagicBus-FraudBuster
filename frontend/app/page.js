'use client';
import { useState, useEffect } from 'react';
import { dashboardAPI } from '../lib/api';
import { StatCard, DataCard, PillarCard } from '../components/cards';

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

      <div className="cards-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          value={stats?.total_candidates || 0}
          label="Total Candidates"
        />
        <StatCard
          value={stats?.enrolled_count || 0}
          label="Enrolled"
          trend="Active in programme"
          trendDirection="up"
          accentColor="var(--success)"
        />
        <StatCard
          value={stats?.avg_onboarding_days || 0}
          label="Avg. Onboarding Days"
        />
        <StatCard
          value={stats?.high_risk_count || 0}
          label="At-Risk Youth"
          trend="Needs intervention"
          trendDirection="down"
          accentColor="var(--danger)"
        />
      </div>

      <div className="cards-grid-2">
        <DataCard title="4 Pillars Overview">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {pillarSummary && Object.values(pillarSummary).map((pillar, i) => (
              <PillarCard
                key={i}
                title={pillar.title}
                metric={pillar.metric}
                description={pillar.description}
                color={pillarColors[pillar.title]}
                href={`/${pillar.title.toLowerCase()}`}
              />
            ))}
          </div>
        </DataCard>

        <DataCard title="Conversion Funnel">
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
        </DataCard>
      </div>

      <DataCard title="Key Metrics" style={{ marginTop: '1.5rem' }}>
        <div className="cards-grid-2">
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
      </DataCard>
    </>
  );
}
