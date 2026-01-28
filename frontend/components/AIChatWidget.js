'use client';
import { useState, useRef, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([
        "Tell me about Magic Bus",
        "How do I complete my profile?",
        "What documents do I need?"
    ]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const userMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: text,
                    conversation_history: messages.slice(-10)
                })
            });

            const data = await response.json();
            
            const assistantMessage = { role: 'assistant', content: data.response };
            setMessages(prev => [...prev, assistantMessage]);
            
            if (data.suggestions && data.suggestions.length > 0) {
                setSuggestions(data.suggestions);
            }
        } catch (error) {
            const errorMessage = { 
                role: 'assistant', 
                content: "I'm having trouble connecting. Please try again." 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleSuggestionClick = (suggestion) => {
        sendMessage(suggestion);
    };

    if (!isOpen) {
        return (
            <button className="chat-fab" onClick={() => setIsOpen(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
        );
    }

    return (
        <div className="chat-widget">
            <div className="chat-header">
                <div className="chat-header-info">
                    <div className="chat-avatar">AI</div>
                    <div>
                        <div className="chat-title">PathFinder Assistant</div>
                        <div className="chat-status">Powered by GPT-4o</div>
                    </div>
                </div>
                <button className="chat-close" onClick={() => setIsOpen(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-welcome">
                        <div className="welcome-icon">AI</div>
                        <h3>Hi! I'm your PathFinder Assistant</h3>
                        <p>I can help you with your Magic Bus application. Ask me anything!</p>
                    </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                        <div className="message-bubble">
                            {msg.content}
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="chat-message assistant">
                        <div className="message-bubble typing">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {suggestions.length > 0 && messages.length < 3 && (
                <div className="chat-suggestions">
                    {suggestions.map((suggestion, idx) => (
                        <button 
                            key={idx}
                            className="suggestion-chip"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={loading}
                    className="chat-input"
                />
                <button type="submit" disabled={loading || !input.trim()} className="chat-send">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
}
