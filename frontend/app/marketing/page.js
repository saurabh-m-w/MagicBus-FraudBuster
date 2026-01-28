'use client';
import { useState, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MarketingPage() {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [results, setResults] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState(null);
    const fileInputRef = useRef(null);

    const checkWhatsAppStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/whatsapp/status`);
            const data = await res.json();
            setWhatsappStatus(data);
        } catch (e) {
            setWhatsappStatus({ twilio_enabled: false, mode: 'error' });
        }
    };

    useState(() => {
        checkWhatsAppStatus();
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            parseCSV(selectedFile);
        } else {
            alert('Please upload a valid CSV file');
        }
    };

    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            const phoneIndex = headers.findIndex(h => 
                h.includes('phone') || h.includes('mobile') || h.includes('number') || h.includes('whatsapp')
            );
            const nameIndex = headers.findIndex(h => 
                h.includes('name')
            );

            if (phoneIndex === -1) {
                alert('CSV must have a column with "phone", "mobile", "number", or "whatsapp" in the header');
                return;
            }

            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values[phoneIndex]) {
                    let phone = values[phoneIndex];
                    
                    // Handle Excel scientific notation (e.g., 9.19923E+11)
                    if (phone.includes('E+') || phone.includes('e+')) {
                        const num = parseFloat(phone);
                        if (!isNaN(num)) {
                            phone = num.toFixed(0);
                        }
                    }
                    
                    phone = phone.replace(/[^0-9+]/g, '');
                    if (!phone.startsWith('+')) {
                        if (phone.startsWith('91') && phone.length > 10) {
                            phone = '+' + phone;
                        } else if (phone.length === 10) {
                            phone = '+91' + phone;
                        } else {
                            phone = '+' + phone;
                        }
                    }
                    data.push({
                        phone: phone,
                        name: nameIndex !== -1 ? values[nameIndex] : 'User',
                        raw: values
                    });
                }
            }
            setParsedData(data);
            setPreviewMode(true);
        };
        reader.readAsText(file);
    };

    const handleSendMessages = async () => {
        if (!message.trim()) {
            alert('Please enter a message');
            return;
        }
        if (parsedData.length === 0) {
            alert('No recipients found');
            return;
        }

        setSending(true);
        setResults(null);

        try {
            const recipients = parsedData.map(d => ({
                to: `whatsapp:${d.phone}`,
                name: d.name
            }));

            const response = await fetch(`${API_BASE}/whatsapp/marketing/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message_template: message,
                    recipients: recipients
                })
            });

            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Failed to send:', error);
            alert('Failed to send messages. Check console for details.');
        } finally {
            setSending(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setParsedData([]);
        setMessage('');
        setResults(null);
        setPreviewMode(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-title">Marketing - WhatsApp Broadcast</h1>
                        <p className="page-subtitle">Upload CSV and send WhatsApp messages to your audience</p>
                    </div>
                    <div className={`status-badge ${whatsappStatus?.twilio_enabled ? 'live' : 'simulation'}`}>
                        {whatsappStatus?.twilio_enabled ? 'Twilio Live' : 'Simulation Mode'}
                    </div>
                </div>
            </div>

            {!results ? (
                <div className="grid-2">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">1. Upload Recipients CSV</h2>
                        </div>
                        <div className="card-body">
                            <div 
                                className="upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                {file ? (
                                    <div className="upload-success">
                                        <div className="upload-icon">CSV</div>
                                        <div className="upload-filename">{file.name}</div>
                                        <div className="upload-count">{parsedData.length} recipients found</div>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <div className="upload-icon">+</div>
                                        <div>Click to upload CSV file</div>
                                        <div className="upload-hint">Must contain a column with phone numbers</div>
                                    </div>
                                )}
                            </div>

                            <div className="csv-format-hint">
                                <strong>CSV Format:</strong> name, phone (or mobile/number/whatsapp)
                                <br />
                                <code>Rahul, 9876543210</code>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">2. Compose Message</h2>
                        </div>
                        <div className="card-body">
                            <div className="form-group">
                                <label>Message Template</label>
                                <textarea
                                    className="form-input"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Hi {name}, join Magic Bus today for free skill training and job placement support!"
                                    rows={6}
                                />
                                <div className="form-hint">Use {'{name}'} to personalize with recipient name</div>
                            </div>

                            <div className="message-preview-box">
                                <div className="preview-label">Preview</div>
                                <div className="preview-content">
                                    {message.replace('{name}', parsedData[0]?.name || 'User') || 'Your message will appear here...'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Campaign Results</h2>
                        <button className="btn btn-secondary" onClick={resetForm}>New Campaign</button>
                    </div>
                    <div className="card-body">
                        <div className="results-summary">
                            <div className="result-stat">
                                <div className="result-value">{results.total}</div>
                                <div className="result-label">Total</div>
                            </div>
                            <div className="result-stat success">
                                <div className="result-value">{results.success}</div>
                                <div className="result-label">Sent</div>
                            </div>
                            <div className="result-stat failed">
                                <div className="result-value">{results.failed}</div>
                                <div className="result-label">Failed</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {previewMode && parsedData.length > 0 && !results && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-header">
                        <h2 className="card-title">3. Review Recipients ({parsedData.length})</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={handleSendMessages}
                            disabled={sending || !message.trim()}
                        >
                            {sending ? 'Sending...' : `Send to ${parsedData.length} Recipients`}
                        </button>
                    </div>
                    <div className="card-body">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>WhatsApp Format</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.slice(0, 20).map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td>{item.name}</td>
                                        <td>{item.phone}</td>
                                        <td><code>whatsapp:{item.phone}</code></td>
                                    </tr>
                                ))}
                                {parsedData.length > 20 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                            ... and {parsedData.length - 20} more recipients
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
