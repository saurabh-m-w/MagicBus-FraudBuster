'use client';

import { useEffect, useState } from 'react';

export default function SupportAgent() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        // Load ElevenLabs ConvAI widget script
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
        script.async = true;
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);

        return () => {
            // Cleanup on unmount
            const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, []);

    return (
        <>
            {/* Floating button to show/hide support */}
            <div 
                className="support-agent-toggle"
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.3s ease',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(99, 102, 241, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
                }}
            >
                <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                        animation: isMinimized ? 'none' : 'pulse 2s infinite'
                    }}
                >
                    {isMinimized ? (
                        // Microphone icon
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                    ) : (
                        // Close icon
                        <path d="M18 6L6 18M6 6l12 12" />
                    )}
                </svg>
                <span>{isMinimized ? '24/7 AI Support' : 'Close'}</span>
                {isMinimized && (
                    <span style={{
                        background: '#10b981',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        animation: 'blink 1.5s infinite'
                    }} />
                )}
            </div>

            {/* Support Agent Container */}
            <div 
                style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '20px',
                    zIndex: 9998,
                    width: '380px',
                    maxWidth: 'calc(100vw - 40px)',
                    background: 'var(--surface)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 50px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    transform: isMinimized ? 'scale(0) translateY(100px)' : 'scale(1) translateY(0)',
                    opacity: isMinimized ? 0 : 1,
                    transformOrigin: 'bottom left',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    pointerEvents: isMinimized ? 'none' : 'auto'
                }}
            >
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    padding: '1rem 1.25rem',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '1rem' }}>PathFinder AI Support</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    background: '#10b981',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    display: 'inline-block'
                                }} />
                                Live - Voice & Chat Available
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--surface-light)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            24/7 Available
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Multilingual
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            </svg>
                            Voice Enabled
                        </span>
                    </div>
                </div>

                {/* ElevenLabs Widget Container */}
                <div style={{ 
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {isLoaded ? (
                        <elevenlabs-convai agent-id="agent_9201kg3767sae4xvfm100h0vym8d"></elevenlabs-convai>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                            <div>Loading AI Support Agent...</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--surface-light)',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                }}>
                    Powered by ElevenLabs ConvAI | Click microphone or type to start
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                elevenlabs-convai {
                    --elevenlabs-convai-widget-width: 100%;
                    --elevenlabs-convai-widget-height: 400px;
                }
            `}</style>
        </>
    );
}
