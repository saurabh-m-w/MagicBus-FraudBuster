'use client';
import BaseCard from './BaseCard';

export default function StatCard({ 
    value, 
    label, 
    trend,
    trendDirection,
    accentColor,
    className = '' 
}) {
    return (
        <BaseCard 
            className={`stat-card-v2 ${className}`}
            hover
            style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : {}}
        >
            <div 
                className="stat-card-value"
                style={accentColor ? { color: accentColor } : {}}
            >
                {value}
            </div>
            <div className="stat-card-label">{label}</div>
            {trend && (
                <span className={`stat-card-trend ${trendDirection || ''}`}>
                    {trend}
                </span>
            )}
        </BaseCard>
    );
}
