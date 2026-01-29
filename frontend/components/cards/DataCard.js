'use client';
import BaseCard from './BaseCard';

export default function DataCard({ 
    title, 
    subtitle,
    action,
    children, 
    className = '',
    maxHeight,
    noPadding = false
}) {
    return (
        <BaseCard className={`data-card ${className}`} padding="none">
            {title && (
                <div className="data-card-header">
                    <div>
                        <h2 className="data-card-title">{title}</h2>
                        {subtitle && (
                            <p style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-secondary)', 
                                margin: '0.25rem 0 0 0' 
                            }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action && <div className="data-card-action">{action}</div>}
                </div>
            )}
            <div 
                className="data-card-body"
                style={{ 
                    maxHeight: maxHeight || 'none',
                    overflowY: maxHeight ? 'auto' : 'visible',
                    padding: noPadding ? 0 : '1.5rem'
                }}
            >
                {children}
            </div>
        </BaseCard>
    );
}
