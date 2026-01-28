'use client';
import BaseCard from './BaseCard';

export default function DataCard({ 
    title, 
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
                    <h2 className="data-card-title">{title}</h2>
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
