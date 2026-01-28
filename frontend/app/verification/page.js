'use client';
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VerificationPage() {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('documents_submitted');

    useEffect(() => {
        fetchCandidates();
    }, [filter]);

    const fetchCandidates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/streamline/candidates/${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setCandidates(data);
            setSelectedCandidate(null);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCandidateDetail = async (candidateId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/streamline/candidates/detail/${candidateId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setSelectedCandidate(data);
        } catch (error) {
            console.error('Error fetching candidate detail:', error);
        }
    };

    const validateDocument = async (docType, value) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/ai/validate-document?document_type=${docType}&document_value=${value}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return await response.json();
        } catch (error) {
            return { valid: false, message: 'Validation failed' };
        }
    };

    const handleVerify = async (youthId, action) => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const newStatus = action === 'approve' ? 'verified' : 'documents_pending';
            
            await fetch(`${API_BASE}/streamline/candidates/${youthId}/status?new_status=${newStatus}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setSelectedCandidate(null);
            fetchCandidates();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleEnroll = async (youthId) => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/streamline/candidates/${youthId}/status?new_status=enrolled`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setSelectedCandidate(null);
            fetchCandidates();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const DocumentCard = ({ title, value, type }) => {
        const [validation, setValidation] = useState(null);
        const [checking, setChecking] = useState(false);

        const checkValidation = async () => {
            if (!value) return;
            setChecking(true);
            const result = await validateDocument(type, value);
            setValidation(result);
            setChecking(false);
        };

        useEffect(() => {
            if (value) checkValidation();
        }, [value]);

        return (
            <div className="doc-card">
                <div className="doc-header">
                    <span className="doc-title">{title}</span>
                    {validation && (
                        <span className={`doc-status ${validation.valid ? 'valid' : 'invalid'}`}>
                            {validation.valid ? 'Valid' : 'Invalid'}
                        </span>
                    )}
                </div>
                <div className="doc-value">{value || 'Not provided'}</div>
                {validation && !validation.valid && (
                    <div className="doc-error">{validation.message}</div>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Document Verification</h1>
                <p className="page-subtitle">Review and verify submitted documents</p>
            </div>

            <div className="verification-filters">
                <button 
                    className={`filter-btn ${filter === 'documents_submitted' ? 'active' : ''}`}
                    onClick={() => setFilter('documents_submitted')}
                >
                    Pending Review ({candidates.length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
                    onClick={() => setFilter('verified')}
                >
                    Verified
                </button>
                <button 
                    className={`filter-btn ${filter === 'documents_pending' ? 'active' : ''}`}
                    onClick={() => setFilter('documents_pending')}
                >
                    Needs Resubmission
                </button>
            </div>

            <div className="verification-grid">
                <div className="candidates-list">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Candidates</h2>
                        </div>
                        <div className="card-body">
                            {candidates.length === 0 ? (
                                <div className="empty-state">No candidates in this queue</div>
                            ) : (
                                <div className="candidate-items">
                                    {candidates.map(c => (
                                        <div 
                                            key={c.id}
                                            className={`candidate-item ${selectedCandidate?.id === c.id ? 'selected' : ''}`}
                                            onClick={() => fetchCandidateDetail(c.id)}
                                        >
                                            <div className="candidate-avatar">
                                                {c.name?.charAt(0)}
                                            </div>
                                            <div className="candidate-info">
                                                <div className="candidate-name">{c.name}</div>
                                                <div className="candidate-meta">{c.phone}</div>
                                            </div>
                                            <div className="candidate-score">
                                                {c.scout_score?.toFixed(0)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="candidate-detail">
                    {selectedCandidate ? (
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Review: {selectedCandidate.name}</h2>
                            </div>
                            <div className="card-body">
                                <div className="detail-section">
                                    <h3>Personal Information</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="label">Age</span>
                                            <span className="value">{selectedCandidate.age}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Gender</span>
                                            <span className="value">{selectedCandidate.gender}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Location</span>
                                            <span className="value">{selectedCandidate.location}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Education</span>
                                            <span className="value">{selectedCandidate.education_level}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Documents</h3>
                                    <div className="docs-grid">
                                        <DocumentCard 
                                            title="Aadhar Card" 
                                            value={selectedCandidate.aadhar_number}
                                            type="aadhar"
                                        />
                                        <DocumentCard 
                                            title="PAN Card" 
                                            value={selectedCandidate.pan_number}
                                            type="pan"
                                        />
                                        <DocumentCard 
                                            title="BPL/Ration Card" 
                                            value={selectedCandidate.bpl_card_number}
                                            type="bpl"
                                        />
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>SCOUT Analysis</h3>
                                    <div className="scout-score-large">
                                        <div className="score-circle">
                                            {selectedCandidate.scout_score?.toFixed(0)}
                                        </div>
                                        <div className="score-label">Propensity Score</div>
                                    </div>
                                </div>

                                <div className="verification-actions">
                                    {filter === 'documents_submitted' && (
                                        <>
                                            <button 
                                                className="btn btn-success"
                                                onClick={() => handleVerify(selectedCandidate.id, 'approve')}
                                                disabled={processing}
                                            >
                                                Approve Documents
                                            </button>
                                            <button 
                                                className="btn btn-danger"
                                                onClick={() => handleVerify(selectedCandidate.id, 'reject')}
                                                disabled={processing}
                                            >
                                                Request Resubmission
                                            </button>
                                        </>
                                    )}
                                    {filter === 'verified' && (
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => handleEnroll(selectedCandidate.id)}
                                            disabled={processing}
                                        >
                                            Enroll in Programme
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-body">
                                <div className="empty-state">
                                    Select a candidate to review their documents
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
