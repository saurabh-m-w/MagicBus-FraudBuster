'use client';
import { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [message, setMessage] = useState(null);
    const [uploadStatus, setUploadStatus] = useState({});
    const [aadharOTP, setAadharOTP] = useState({
        step: 'input',
        referenceId: null,
        otp: '',
        verified: false,
        loading: false,
        error: null
    });

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        age: '',
        gender: '',
        phone: '',
        alternate_phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        father_name: '',
        mother_name: '',
        guardian_phone: '',
        aadhar_number: '',
        pan_number: '',
        bpl_card_number: '',
        education_level: '',
        institution_name: '',
        year_of_passing: '',
        percentage_10th: '',
        percentage_12th: '',
        percentage_graduation: '',
        income_bracket: '',
        family_income: '',
        skills: [],
        interests: [],
        preferred_job_roles: []
    });

    useEffect(() => {
        fetchProfile();
        fetchUploadStatus();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProfile(data);
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                age: data.age || '',
                gender: data.gender || '',
                phone: data.phone || '',
                alternate_phone: data.alternate_phone || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                father_name: data.father_name || '',
                mother_name: data.mother_name || '',
                guardian_phone: data.guardian_phone || '',
                aadhar_number: data.aadhar_number || '',
                pan_number: data.pan_number || '',
                bpl_card_number: data.bpl_card_number || '',
                education_level: data.education_level || '',
                institution_name: data.institution_name || '',
                year_of_passing: data.year_of_passing || '',
                percentage_10th: data.percentage_10th || '',
                percentage_12th: data.percentage_12th || '',
                percentage_graduation: data.percentage_graduation || '',
                income_bracket: data.income_bracket || '',
                family_income: data.family_income || '',
                skills: data.skills || [],
                interests: data.interests || [],
                preferred_job_roles: data.preferred_job_roles || []
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUploadStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/upload/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setUploadStatus(data);
        } catch (error) {
            console.error('Error fetching upload status:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (field, value) => {
        const items = value.split(',').map(s => s.trim()).filter(s => s);
        setFormData(prev => ({ ...prev, [field]: items }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setMessage({ type: 'success', text: 'Profile saved successfully!' });
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to save profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleAadharSendOTP = async () => {
        if (!formData.aadhar_number || formData.aadhar_number.length !== 12) {
            setAadharOTP(prev => ({ ...prev, error: 'Please enter a valid 12-digit Aadhar number' }));
            return;
        }
        
        setAadharOTP(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/kyc/aadhaar/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ aadhaar_number: formData.aadhar_number })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setAadharOTP(prev => ({
                    ...prev,
                    step: 'verify',
                    referenceId: String(data.reference_id),
                    loading: false,
                    error: null
                }));
            } else {
                setAadharOTP(prev => ({
                    ...prev,
                    loading: false,
                    error: data.detail || 'Failed to send OTP'
                }));
            }
        } catch (error) {
            setAadharOTP(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to connect to verification service'
            }));
        }
    };

    const handleAadharVerifyOTP = async () => {
        if (!aadharOTP.otp || aadharOTP.otp.length !== 6) {
            setAadharOTP(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }));
            return;
        }
        
        setAadharOTP(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/kyc/aadhaar/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reference_id: String(aadharOTP.referenceId),
                    otp: String(aadharOTP.otp)
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.verified) {
                setAadharOTP(prev => ({
                    ...prev,
                    step: 'verified',
                    verified: true,
                    loading: false,
                    error: null
                }));
                
                if (data.data) {
                    if (data.data.name && !formData.first_name) {
                        const nameParts = data.data.name.split(' ');
                        setFormData(prev => ({
                            ...prev,
                            first_name: nameParts[0],
                            last_name: nameParts.slice(1).join(' ')
                        }));
                    }
                    if (data.data.state && !formData.state) {
                        setFormData(prev => ({ ...prev, state: data.data.state }));
                    }
                    if (data.data.district && !formData.city) {
                        setFormData(prev => ({ ...prev, city: data.data.district }));
                    }
                    if (data.data.pincode && !formData.pincode) {
                        setFormData(prev => ({ ...prev, pincode: data.data.pincode.toString() }));
                    }
                }
                
                setMessage({ type: 'success', text: 'Aadhar verified successfully! Details auto-filled.' });
            } else {
                setAadharOTP(prev => ({
                    ...prev,
                    loading: false,
                    error: data.message || 'Invalid OTP'
                }));
            }
        } catch (error) {
            setAadharOTP(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to verify OTP'
            }));
        }
    };

    const handleFileUpload = async (uploadType, certType = null) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.jpg,.jpeg,.png,.pdf';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const token = localStorage.getItem('token');
                let url = `${API_BASE}/upload/${uploadType}`;
                if (certType) {
                    url = `${API_BASE}/upload/certificate/${certType}`;
                }
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                
                if (response.ok) {
                    setMessage({ type: 'success', text: 'Document uploaded successfully!' });
                    fetchUploadStatus();
                } else {
                    const error = await response.json();
                    setMessage({ type: 'error', text: error.detail || 'Upload failed' });
                }
            } catch (error) {
                setMessage({ type: 'error', text: 'Upload failed' });
            }
        };
        
        input.click();
    };

    const validateForm = () => {
        const required = {
            personal: ['first_name', 'last_name', 'age', 'gender', 'phone', 'address', 'city', 'state', 'pincode'],
            family: ['father_name', 'mother_name', 'guardian_phone', 'income_bracket'],
            documents: ['aadhar_number'],
            education: ['education_level', 'institution_name', 'year_of_passing']
        };

        const missing = [];
        
        for (const [section, fields] of Object.entries(required)) {
            for (const field of fields) {
                if (!formData[field]) {
                    missing.push({ section, field });
                }
            }
        }

        // Check document uploads
        if (!uploadStatus.aadhar?.uploaded) {
            missing.push({ section: 'documents', field: 'Aadhar Document' });
        }
        if (!uploadStatus.photo?.uploaded) {
            missing.push({ section: 'documents', field: 'Passport Photo' });
        }

        // Check education certificates based on level
        const eduLevel = formData.education_level?.toLowerCase();
        if (eduLevel) {
            if (!uploadStatus.certificates?.['10th']) {
                missing.push({ section: 'education', field: '10th Certificate' });
            }
            if ((eduLevel.includes('12') || eduLevel.includes('graduate') || eduLevel.includes('diploma')) && !uploadStatus.certificates?.['12th']) {
                missing.push({ section: 'education', field: '12th Certificate' });
            }
            if ((eduLevel.includes('graduate') || eduLevel.includes('degree')) && !uploadStatus.certificates?.graduation) {
                missing.push({ section: 'education', field: 'Graduation Certificate' });
            }
        }

        return missing;
    };

    const handleSubmitForVerification = async () => {
        const missing = validateForm();
        
        if (missing.length > 0) {
            const missingFields = missing.map(m => m.field.replace(/_/g, ' ')).join(', ');
            setMessage({ 
                type: 'error', 
                text: `Please complete all required fields: ${missingFields}` 
            });
            return;
        }

        setSubmitting(true);
        try {
            // First save the profile
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            // Then submit for verification
            const response = await fetch(`${API_BASE}/user/submit-documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                setMessage({ type: 'success', text: 'Application submitted for verification!' });
                fetchProfile();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Submission failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Submission failed' });
        } finally {
            setSubmitting(false);
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal Details' },
        { id: 'family', label: 'Family Details' },
        { id: 'documents', label: 'Identity Documents' },
        { id: 'education', label: 'Education' },
        { id: 'preferences', label: 'Preferences' }
    ];

    const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
    const isLastTab = currentTabIndex === tabs.length - 1;
    const isFirstTab = currentTabIndex === 0;

    const goToNextTab = () => {
        if (!isLastTab) {
            setActiveTab(tabs[currentTabIndex + 1].id);
        }
    };

    const goToPrevTab = () => {
        if (!isFirstTab) {
            setActiveTab(tabs[currentTabIndex - 1].id);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    const isSubmitted = profile?.onboarding_status === 'documents_submitted' || 
                        profile?.onboarding_status === 'verified' ||
                        profile?.onboarding_status === 'enrolled';

    return (
        <div className="user-profile-page">
            <div className="profile-header-card">
                <div className="profile-avatar">
                    {profile?.first_name?.charAt(0) || 'U'}
                </div>
                <div className="profile-header-info">
                    <h1>{profile?.first_name} {profile?.last_name}</h1>
                    <p>{profile?.email}</p>
                    <div className="profile-meta">
                        <span>{profile?.phone}</span>
                        <span>{profile?.city}, {profile?.state}</span>
                    </div>
                </div>
                <div className="profile-status">
                    <span className={`status-badge ${profile?.documents_uploaded ? 'complete' : 'incomplete'}`}>
                        {profile?.onboarding_status?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="profile-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="profile-form-card">
                {/* Personal Details Tab */}
                {activeTab === 'personal' && (
                    <div className="profile-section">
                        <h3>Personal Information</h3>
                        <p className="section-desc">Basic details about yourself</p>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} disabled={isSubmitted} required />
                            </div>
                            <div className="form-group">
                                <label>Last Name *</label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} disabled={isSubmitted} required />
                            </div>
                            <div className="form-group">
                                <label>Age *</label>
                                <input type="number" name="age" value={formData.age} onChange={handleChange} disabled={isSubmitted} min="16" max="35" required />
                            </div>
                            <div className="form-group">
                                <label>Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} disabled={isSubmitted} required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={isSubmitted} required />
                            </div>
                            <div className="form-group">
                                <label>Alternate Phone</label>
                                <input type="tel" name="alternate_phone" value={formData.alternate_phone} onChange={handleChange} disabled={isSubmitted} />
                            </div>
                        </div>

                        <h4 style={{marginTop: '1.5rem'}}>Address</h4>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Full Address *</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} disabled={isSubmitted} rows="2" required />
                            </div>
                            <div className="form-group">
                                <label>City *</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={isSubmitted} required />
                            </div>
                            <div className="form-group">
                                <label>State *</label>
                                <select name="state" value={formData.state} onChange={handleChange} disabled={isSubmitted} required>
                                    <option value="">Select State</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                    <option value="West Bengal">West Bengal</option>
                                    <option value="Bihar">Bihar</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Kerala">Kerala</option>
                                    <option value="Delhi">Delhi</option>
                                    <option value="Punjab">Punjab</option>
                                    <option value="Haryana">Haryana</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Pincode *</label>
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} disabled={isSubmitted} maxLength="6" required />
                            </div>
                        </div>
                    </div>
                )}

                {/* Family Details Tab */}
                {activeTab === 'family' && (
                    <div className="profile-section">
                        <h3>Family Information</h3>
                        <p className="section-desc">Details about your family</p>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Father's Name *</label>
                                <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} disabled={isSubmitted} required />
                            </div>
                            <div className="form-group">
                                <label>Mother's Name *</label>
                                <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} disabled={isSubmitted} required />
                            </div>
                            <div className="form-group">
                                <label>Guardian Phone *</label>
                                <input type="tel" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} disabled={isSubmitted} required />
                            </div>
                            <div className="form-group">
                                <label>Family Income Bracket *</label>
                                <select name="income_bracket" value={formData.income_bracket} onChange={handleChange} disabled={isSubmitted} required>
                                    <option value="">Select Income Bracket</option>
                                    <option value="below_1_lakh">Below 1 Lakh/year</option>
                                    <option value="1_3_lakh">1-3 Lakh/year</option>
                                    <option value="3_5_lakh">3-5 Lakh/year</option>
                                    <option value="5_10_lakh">5-10 Lakh/year</option>
                                    <option value="above_10_lakh">Above 10 Lakh/year</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Annual Family Income (in Rupees)</label>
                                <input type="number" name="family_income" value={formData.family_income} onChange={handleChange} disabled={isSubmitted} placeholder="e.g. 200000" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Identity Documents Tab */}
                {activeTab === 'documents' && (
                    <div className="profile-section">
                        <h3>Identity Documents</h3>
                        <p className="section-desc">Upload your identity proofs. Supported formats: JPG, PNG, PDF (Max 5MB)</p>
                        
                        <div className="docs-upload-grid">
                            {/* Photo */}
                            <div className="doc-upload-card">
                                <div className="doc-upload-header">
                                    <span className="doc-icon">P</span>
                                    <div>
                                        <h4>Passport Photo *</h4>
                                        <p>Recent photograph</p>
                                    </div>
                                    {uploadStatus.photo?.uploaded && <span className="upload-check">Uploaded</span>}
                                </div>
                                <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleFileUpload('photo')}
                                    disabled={isSubmitted}
                                >
                                    {uploadStatus.photo?.uploaded ? 'Re-upload' : 'Upload Photo'}
                                </button>
                            </div>

                            {/* Aadhar */}
                            <div className="doc-upload-card">
                                <div className="doc-upload-header">
                                    <span className="doc-icon">A</span>
                                    <div>
                                        <h4>Aadhar Card *</h4>
                                        <p>{aadharOTP.verified ? 'Verified via OTP' : 'Verify with OTP'}</p>
                                    </div>
                                    {aadharOTP.verified && <span className="upload-check" style={{background: 'var(--success)', color: 'white'}}>Verified</span>}
                                    {uploadStatus.aadhar?.uploaded && <span className="upload-check">Uploaded</span>}
                                </div>
                                
                                {aadharOTP.step === 'input' && (
                                    <>
                                        <div className="form-group" style={{marginBottom: '0.5rem'}}>
                                            <input 
                                                type="text" 
                                                name="aadhar_number" 
                                                value={formData.aadhar_number} 
                                                onChange={handleChange}
                                                disabled={isSubmitted || aadharOTP.verified}
                                                placeholder="12-digit Aadhar number"
                                                maxLength="12"
                                            />
                                        </div>
                                        {aadharOTP.error && (
                                            <div style={{color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '0.5rem'}}>
                                                {aadharOTP.error}
                                            </div>
                                        )}
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={handleAadharSendOTP}
                                            disabled={isSubmitted || aadharOTP.loading || aadharOTP.verified || formData.aadhar_number.length !== 12}
                                            style={{marginBottom: '0.5rem', width: '100%'}}
                                        >
                                            {aadharOTP.loading ? 'Sending OTP...' : 'Send OTP for Verification'}
                                        </button>
                                    </>
                                )}
                                
                                {aadharOTP.step === 'verify' && (
                                    <>
                                        <div className="form-group" style={{marginBottom: '0.5rem'}}>
                                            <input 
                                                type="text" 
                                                value={aadharOTP.otp}
                                                onChange={(e) => setAadharOTP(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                                placeholder="Enter 6-digit OTP"
                                                maxLength="6"
                                            />
                                        </div>
                                        {aadharOTP.error && (
                                            <div style={{color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '0.5rem'}}>
                                                {aadharOTP.error}
                                            </div>
                                        )}
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={handleAadharVerifyOTP}
                                                disabled={aadharOTP.loading || aadharOTP.otp.length !== 6}
                                                style={{flex: 1}}
                                            >
                                                {aadharOTP.loading ? 'Verifying...' : 'Verify OTP'}
                                            </button>
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setAadharOTP({ step: 'input', referenceId: null, otp: '', verified: false, loading: false, error: null })}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                                
                                {aadharOTP.verified && (
                                    <button 
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleFileUpload('aadhar')}
                                        disabled={isSubmitted}
                                        style={{width: '100%'}}
                                    >
                                        {uploadStatus.aadhar?.uploaded ? 'Re-upload Document' : 'Upload Aadhar Document'}
                                    </button>
                                )}
                            </div>

                            {/* PAN */}
                            <div className="doc-upload-card">
                                <div className="doc-upload-header">
                                    <span className="doc-icon">P</span>
                                    <div>
                                        <h4>PAN Card</h4>
                                        <p>Optional</p>
                                    </div>
                                    {uploadStatus.pan?.uploaded && <span className="upload-check">Uploaded</span>}
                                </div>
                                <div className="form-group" style={{marginBottom: '0.5rem'}}>
                                    <input 
                                        type="text" 
                                        name="pan_number" 
                                        value={formData.pan_number} 
                                        onChange={handleChange}
                                        disabled={isSubmitted}
                                        placeholder="10-character PAN"
                                        maxLength="10"
                                        style={{textTransform: 'uppercase'}}
                                    />
                                </div>
                                <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleFileUpload('pan')}
                                    disabled={isSubmitted}
                                >
                                    {uploadStatus.pan?.uploaded ? 'Re-upload' : 'Upload PAN'}
                                </button>
                            </div>

                            {/* BPL Card */}
                            <div className="doc-upload-card">
                                <div className="doc-upload-header">
                                    <span className="doc-icon">B</span>
                                    <div>
                                        <h4>BPL/Ration Card</h4>
                                        <p>If applicable</p>
                                    </div>
                                    {uploadStatus.bpl?.uploaded && <span className="upload-check">Uploaded</span>}
                                </div>
                                <div className="form-group" style={{marginBottom: '0.5rem'}}>
                                    <input 
                                        type="text" 
                                        name="bpl_card_number" 
                                        value={formData.bpl_card_number} 
                                        onChange={handleChange}
                                        disabled={isSubmitted}
                                        placeholder="BPL/Ration card number"
                                    />
                                </div>
                                <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleFileUpload('bpl')}
                                    disabled={isSubmitted}
                                >
                                    {uploadStatus.bpl?.uploaded ? 'Re-upload' : 'Upload BPL Card'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                    <div className="profile-section">
                        <h3>Education Details</h3>
                        <p className="section-desc">Your educational qualifications</p>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Highest Qualification *</label>
                                <select name="education_level" value={formData.education_level} onChange={handleChange} disabled={isSubmitted} required>
                                    <option value="">Select Qualification</option>
                                    <option value="Below 10th">Below 10th</option>
                                    <option value="10th Pass">10th Pass (SSC)</option>
                                    <option value="12th Pass">12th Pass (HSC)</option>
                                    <option value="ITI">ITI</option>
                                    <option value="Diploma">Diploma</option>
                                    <option value="Graduate">Graduate (Degree)</option>
                                    <option value="Post Graduate">Post Graduate</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Institution/School Name *</label>
                                <input type="text" name="institution_name" value={formData.institution_name} onChange={handleChange} disabled={isSubmitted} required />
                            </div>
                            <div className="form-group">
                                <label>Year of Passing *</label>
                                <input type="number" name="year_of_passing" value={formData.year_of_passing} onChange={handleChange} disabled={isSubmitted} min="2000" max="2026" required />
                            </div>
                        </div>

                        <h4 style={{marginTop: '1.5rem', marginBottom: '1rem'}}>Marks/Percentage</h4>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>10th Percentage</label>
                                <input type="number" name="percentage_10th" value={formData.percentage_10th} onChange={handleChange} disabled={isSubmitted} min="0" max="100" step="0.01" placeholder="e.g. 75.5" />
                            </div>
                            <div className="form-group">
                                <label>12th Percentage</label>
                                <input type="number" name="percentage_12th" value={formData.percentage_12th} onChange={handleChange} disabled={isSubmitted} min="0" max="100" step="0.01" placeholder="e.g. 68.2" />
                            </div>
                            <div className="form-group">
                                <label>Graduation Percentage</label>
                                <input type="number" name="percentage_graduation" value={formData.percentage_graduation} onChange={handleChange} disabled={isSubmitted} min="0" max="100" step="0.01" placeholder="e.g. 72.0" />
                            </div>
                        </div>

                        <h4 style={{marginTop: '1.5rem', marginBottom: '1rem'}}>Upload Certificates *</h4>
                        <p className="section-desc">Upload certificates based on your qualification</p>
                        
                        <div className="docs-upload-grid">
                            <div className="doc-upload-card">
                                <div className="doc-upload-header">
                                    <span className="doc-icon">10</span>
                                    <div>
                                        <h4>10th Certificate *</h4>
                                        <p>SSC Marksheet</p>
                                    </div>
                                    {uploadStatus.certificates?.['10th'] && <span className="upload-check">Uploaded</span>}
                                </div>
                                <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleFileUpload('certificate', '10th')}
                                    disabled={isSubmitted}
                                >
                                    {uploadStatus.certificates?.['10th'] ? 'Re-upload' : 'Upload'}
                                </button>
                            </div>

                            {(formData.education_level?.includes('12') || formData.education_level?.includes('Graduate') || formData.education_level?.includes('Diploma') || formData.education_level?.includes('ITI') || formData.education_level?.includes('Post')) && (
                                <div className="doc-upload-card">
                                    <div className="doc-upload-header">
                                        <span className="doc-icon">12</span>
                                        <div>
                                            <h4>12th Certificate *</h4>
                                            <p>HSC Marksheet</p>
                                        </div>
                                        {uploadStatus.certificates?.['12th'] && <span className="upload-check">Uploaded</span>}
                                    </div>
                                    <button 
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleFileUpload('certificate', '12th')}
                                        disabled={isSubmitted}
                                    >
                                        {uploadStatus.certificates?.['12th'] ? 'Re-upload' : 'Upload'}
                                    </button>
                                </div>
                            )}

                            {(formData.education_level?.includes('Graduate') || formData.education_level?.includes('Post')) && (
                                <div className="doc-upload-card">
                                    <div className="doc-upload-header">
                                        <span className="doc-icon">G</span>
                                        <div>
                                            <h4>Graduation Certificate *</h4>
                                            <p>Degree Certificate</p>
                                        </div>
                                        {uploadStatus.certificates?.graduation && <span className="upload-check">Uploaded</span>}
                                    </div>
                                    <button 
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleFileUpload('certificate', 'graduation')}
                                        disabled={isSubmitted}
                                    >
                                        {uploadStatus.certificates?.graduation ? 'Re-upload' : 'Upload'}
                                    </button>
                                </div>
                            )}

                            <div className="doc-upload-card">
                                <div className="doc-upload-header">
                                    <span className="doc-icon">+</span>
                                    <div>
                                        <h4>Other Certificate</h4>
                                        <p>ITI/Diploma/Training</p>
                                    </div>
                                    {uploadStatus.certificates?.other && <span className="upload-check">Uploaded</span>}
                                </div>
                                <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleFileUpload('certificate', 'other')}
                                    disabled={isSubmitted}
                                >
                                    {uploadStatus.certificates?.other ? 'Re-upload' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                    <div className="profile-section">
                        <h3>Skills & Preferences</h3>
                        <p className="section-desc">Help us understand your interests</p>
                        
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Skills (comma separated)</label>
                                <input 
                                    type="text" 
                                    value={formData.skills.join(', ')} 
                                    onChange={(e) => handleArrayChange('skills', e.target.value)}
                                    disabled={isSubmitted}
                                    placeholder="e.g. Computer, English, Communication"
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Interests (comma separated)</label>
                                <input 
                                    type="text" 
                                    value={formData.interests.join(', ')} 
                                    onChange={(e) => handleArrayChange('interests', e.target.value)}
                                    disabled={isSubmitted}
                                    placeholder="e.g. Technology, Healthcare, Retail"
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Preferred Job Roles (comma separated)</label>
                                <input 
                                    type="text" 
                                    value={formData.preferred_job_roles.join(', ')} 
                                    onChange={(e) => handleArrayChange('preferred_job_roles', e.target.value)}
                                    disabled={isSubmitted}
                                    placeholder="e.g. Data Entry, Customer Service, Sales"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="profile-actions">
                    {!isSubmitted ? (
                        <>
                            {!isFirstTab && (
                                <button 
                                    className="btn btn-outline" 
                                    onClick={goToPrevTab}
                                >
                                    Previous
                                </button>
                            )}
                            <div className="action-spacer"></div>
                            {!isLastTab ? (
                                <button 
                                    className="btn btn-primary" 
                                    onClick={goToNextTab}
                                >
                                    Next
                                </button>
                            ) : (
                                <>
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleSubmitForVerification}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit for Verification'}
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="docs-submitted-badge">
                            Application Submitted - Under Review
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
