'use client';
import BaseCard from './BaseCard';

export default function InfoCard({ 
    title,
    children, 
    className = '',
    compact = false
}) {
    return (
        <BaseCard 
            className={`info-card ${className}`} 
            padding={compact ? 'small' : 'default'}
        >
            {title && <h3 className="info-card-title">{title}</h3>}
            <div className="info-card-content">{children}</div>
        </BaseCard>
    );
}
