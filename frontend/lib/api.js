const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}

export const dashboardAPI = {
    getStats: () => fetchAPI('/dashboard/stats'),
    getFunnel: () => fetchAPI('/dashboard/funnel'),
    getRecentActivity: () => fetchAPI('/dashboard/recent-activity'),
    getPillarSummary: () => fetchAPI('/dashboard/pillar-summary'),
};

export const scoutAPI = {
    getCandidates: (minScore = 0, limit = 50) =>
        fetchAPI(`/scout/candidates?min_score=${minScore}&limit=${limit}`),
    getCandidate: (id) => fetchAPI(`/scout/candidates/${id}`),
    getSegments: () => fetchAPI('/scout/segments'),
    getZoneAnalysis: () => fetchAPI('/scout/zone-analysis'),
};

export const streamlineAPI = {
    getPipeline: () => fetchAPI('/streamline/pipeline'),
    getCandidatesByStatus: (status) => fetchAPI(`/streamline/candidates/${status}`),
    updateStatus: (id, status) =>
        fetchAPI(`/streamline/candidates/${id}/status?new_status=${status}`, { method: 'PUT' }),
    getMetrics: () => fetchAPI('/streamline/metrics'),
    getDailyProgress: (days = 7) => fetchAPI(`/streamline/daily-progress?days=${days}`),
};

export const amplifyAPI = {
    getChannelPerformance: () => fetchAPI('/amplify/channel-performance'),
    getAttribution: () => fetchAPI('/amplify/attribution'),
    getBudgetRecommendation: (budget = 100000) =>
        fetchAPI(`/amplify/budget-recommendation?total_budget=${budget}`),
    getTrends: (days = 30) => fetchAPI(`/amplify/trends?days=${days}`),
};

export const thriveAPI = {
    getAtRisk: (minRisk = 30) => fetchAPI(`/thrive/at-risk?min_risk=${minRisk}`),
    getRiskDistribution: () => fetchAPI('/thrive/risk-distribution'),
    getJobs: () => fetchAPI('/thrive/jobs'),
    getJobMatches: (youthId) => fetchAPI(`/thrive/job-matches/${youthId}`),
    getPlacementMetrics: () => fetchAPI('/thrive/placement-metrics'),
    createIntervention: (youthId, type, notes) =>
        fetchAPI('/thrive/interventions', {
            method: 'POST',
            body: JSON.stringify({ youth_id: youthId, intervention_type: type, notes }),
        }),
};

export const whatsappAPI = {
    getStatus: () => fetchAPI('/whatsapp/status'),
    getTemplates: () => fetchAPI('/whatsapp/templates'),
    sendOnboarding: (youthId, messageType) =>
        fetchAPI('/whatsapp/send/onboarding', {
            method: 'POST',
            body: JSON.stringify({ youth_id: youthId, message_type: messageType }),
        }),
    sendNudge: (youthId, nudgeType, customMessage = null) =>
        fetchAPI('/whatsapp/send/nudge', {
            method: 'POST',
            body: JSON.stringify({ 
                youth_id: youthId, 
                nudge_type: nudgeType,
                custom_message: customMessage 
            }),
        }),
    sendBulk: (body, recipients) =>
        fetchAPI('/whatsapp/send/bulk', {
            method: 'POST',
            body: JSON.stringify({ body, recipients }),
        }),
    runCampaign: (campaignName, messageBody, targetSegment, locationFilter = null) =>
        fetchAPI('/whatsapp/campaign', {
            method: 'POST',
            body: JSON.stringify({
                campaign_name: campaignName,
                channel: 'whatsapp',
                message_body: messageBody,
                target_segment: targetSegment,
                location_filter: locationFilter
            }),
        }),
    simulateConversation: (phone, name, age, location, education) =>
        fetchAPI(`/whatsapp/simulate/conversation?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}&age=${age}&location=${encodeURIComponent(location)}&education=${encodeURIComponent(education)}`, {
            method: 'POST',
        }),
};
