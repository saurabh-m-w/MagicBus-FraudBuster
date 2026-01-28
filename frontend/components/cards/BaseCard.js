'use client';

export default function BaseCard({ 
    children, 
    className = '', 
    padding = 'default',
    hover = false,
    onClick,
    style = {}
}) {
    const paddingMap = {
        none: '0',
        small: '1rem',
        default: '1.5rem',
        large: '2rem'
    };

    const cardStyle = {
        background: 'var(--surface)',
        borderRadius: '1rem',
        boxShadow: 'var(--card-shadow)',
        padding: paddingMap[padding] || paddingMap.default,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ...style
    };

    return (
        <div 
            className={`base-card ${hover ? 'base-card-hover' : ''} ${className}`}
            style={cardStyle}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
