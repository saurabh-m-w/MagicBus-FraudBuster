'use client';
import Link from 'next/link';
import BaseCard from './BaseCard';

export default function PillarCard({ 
    title, 
    metric, 
    description, 
    color,
    href,
    className = '' 
}) {
    const content = (
        <BaseCard className={`pillar-card-v2 ${className}`} hover>
            <div 
                className="pillar-card-icon"
                style={{ background: color }}
            >
                {title?.charAt(0)}
            </div>
            <div className="pillar-card-title">{title}</div>
            <div className="pillar-card-metric" style={{ color }}>{metric}</div>
            <div className="pillar-card-desc">{description}</div>
        </BaseCard>
    );

    if (href) {
        return (
            <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                {content}
            </Link>
        );
    }

    return content;
}
